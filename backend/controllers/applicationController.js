const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Event = require('../models/Event');

// Manual populate helper for Fallback database compatibility
const populateApplicationDetails = async (app) => {
  if (!app) return null;
  const appObj = typeof app.toObject === 'function' ? app.toObject() : app;

  if (Application.isFallback) {
    // Populate user
    if (appObj.user) {
      const user = await User.findById(appObj.user);
      if (user) {
        appObj.user = { _id: user._id, name: user.name, email: user.email };
      }
    }
    // Populate resume
    if (appObj.resume) {
      const resume = await Resume.findById(appObj.resume);
      appObj.resume = resume ? (typeof resume.toObject === 'function' ? resume.toObject() : resume) : null;
    }
    // Populate job and job's company
    if (appObj.job) {
      const job = await Job.findById(appObj.job);
      if (job) {
        const jobObj = typeof job.toObject === 'function' ? job.toObject() : job;
        if (jobObj.company) {
          const company = await Company.findById(jobObj.company);
          jobObj.company = company ? (typeof company.toObject === 'function' ? company.toObject() : company) : null;
        }
        appObj.job = jobObj;
      }
    }
  } else {
    // Mongoose population path
    if (typeof app.populate === 'function') {
      await app.populate([
        { path: 'user', select: 'name email' },
        { path: 'resume' },
        { path: 'job', populate: { path: 'company' } }
      ]);
      return app;
    }
  }
  return appObj;
};

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private
const applyJob = async (req, res) => {
  const { jobId, resumeId, notes } = req.body;

  try {
    if (!jobId || !resumeId) {
      return res.status(400).json({ message: 'Please provide job ID and resume ID.' });
    }

    // Verify job and resume exist
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }

    // Check if user already applied
    const alreadyApplied = await Application.findOne({ user: req.user._id, job: jobId });
    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied for this job.' });
    }

    const application = await Application.create({
      user: req.user._id,
      job: jobId,
      resume: resumeId,
      notes: notes || '',
      dates: {
        appliedAt: new Date()
      }
    });

    // Populate company to get the name
    const company = await Company.findById(job.company);
    const companyName = company ? company.name : 'Company';

    // Auto-create a notification
    await Notification.create({
      user: req.user._id,
      title: 'Application Submitted',
      message: `You applied successfully to the ${job.title} position at ${companyName}.`,
      type: 'success'
    });

    // Auto-create a calendar event for the deadline/application milestone
    await Event.create({
      user: req.user._id,
      title: `Applied: ${job.title} (${companyName})`,
      type: 'Application deadline',
      date: new Date(),
      description: `Submitted application with resume: "${resume.title}". Custom notes: ${notes || 'None'}`
    });

    const populated = await populateApplicationDetails(application);
    res.status(201).json(populated);
  } catch (error) {
    console.error('Apply Job Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user applications (Admin gets all)
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    let applications = await Application.find(query);
    const populatedApps = [];
    for (const app of applications) {
      const popApp = await populateApplicationDetails(app);
      populatedApps.push(popApp);
    }

    res.json(populatedApps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private (Admin can update all, Candidates can update notes)
const updateApplication = async (req, res) => {
  const { status, notes, interviewDate, assessmentDate } = req.body;

  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Authorization: candidates can only edit notes, admins can edit status
    if (req.user.role !== 'admin' && application.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this application' });
    }

    // Capture old status to check for transitions
    const oldStatus = application.status;

    // Compile modifications
    let updateData = {};
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (req.user.role === 'admin') {
      if (status !== undefined) {
        updateData.status = status;
      }
      
      const dates = { ...application.dates };
      if (interviewDate !== undefined) {
        dates.interviewDate = interviewDate ? new Date(interviewDate) : null;
      }
      if (assessmentDate !== undefined) {
        dates.assessmentDate = assessmentDate ? new Date(assessmentDate) : null;
      }
      updateData.dates = dates;
    }

    const updated = await Application.findByIdAndUpdate(req.params.id, updateData, { new: true });
    const populated = await populateApplicationDetails(updated);

    // If status changed, send alert notification & trigger calendar actions
    if (status && status !== oldStatus) {
      const job = await Job.findById(populated.job._id || populated.job);
      const company = job ? await Company.findById(job.company) : null;
      const jobTitle = job ? job.title : 'Job';
      const companyName = company ? company.name : 'Company';

      // Create notification
      await Notification.create({
        user: application.user,
        title: `Application Update: ${status}`,
        message: `Your application for ${jobTitle} at ${companyName} has been updated to "${status}".`,
        type: status === 'Rejected' ? 'danger' : status === 'Selected' ? 'success' : 'info'
      });

      // Special Event Scheduling on status transition
      if (status === 'Interview') {
        const iDate = interviewDate ? new Date(interviewDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default to +2 days
        await Event.create({
          user: application.user,
          title: `Interview: ${jobTitle} at ${companyName}`,
          type: 'Interview',
          date: iDate,
          description: `Virtual Round with recruitment team at ${companyName}. Be prepared.`,
          reminder: true
        });
      } else if (status === 'Assessment') {
        const aDate = assessmentDate ? new Date(assessmentDate) : new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // Default to +1 day
        await Event.create({
          user: application.user,
          title: `Technical Test: ${jobTitle} (${companyName})`,
          type: 'Assessment',
          date: aDate,
          description: `Online coding assessment/skills test platform credential link will be sent.`,
          reminder: true
        });
      }
    }

    res.json(populated);
  } catch (error) {
    console.error('Update Application Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  applyJob,
  getApplications,
  updateApplication
};
