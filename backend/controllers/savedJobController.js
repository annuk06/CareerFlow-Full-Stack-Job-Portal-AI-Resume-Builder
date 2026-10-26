const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const Company = require('../models/Company');

const populateSavedJob = async (saved) => {
  if (!saved) return null;
  const savedObj = typeof saved.toObject === 'function' ? saved.toObject() : saved;

  if (SavedJob.isFallback) {
    if (savedObj.job) {
      const job = await Job.findById(savedObj.job);
      if (job) {
        const jobObj = typeof job.toObject === 'function' ? job.toObject() : job;
        if (jobObj.company) {
          const company = await Company.findById(jobObj.company);
          jobObj.company = company ? (typeof company.toObject === 'function' ? company.toObject() : company) : null;
        }
        savedObj.job = jobObj;
      }
    }
  } else {
    if (typeof saved.populate === 'function') {
      await saved.populate({
        path: 'job',
        populate: { path: 'company' }
      });
      return saved;
    }
  }
  return savedObj;
};

// @desc    Bookmark/Save a job
// @route   POST /api/saved-jobs
// @access  Private
const saveJob = async (req, res) => {
  const { jobId } = req.body;

  try {
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const alreadySaved = await SavedJob.findOne({ user: req.user._id, job: jobId });
    if (alreadySaved) {
      return res.status(400).json({ message: 'Job is already saved' });
    }

    const saved = await SavedJob.create({
      user: req.user._id,
      job: jobId
    });

    const populated = await populateSavedJob(saved);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user saved jobs
// @route   GET /api/saved-jobs
// @access  Private
const getSavedJobs = async (req, res) => {
  try {
    const saved = await SavedJob.find({ user: req.user._id });
    const populatedSaved = [];
    for (const item of saved) {
      const popItem = await populateSavedJob(item);
      populatedSaved.push(popItem);
    }
    res.json(populatedSaved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove saved job
// @route   DELETE /api/saved-jobs/:id (or job ID)
// @access  Private
const deleteSavedJob = async (req, res) => {
  try {
    // Try matching bookmark by direct saved-job id first
    let saved = await SavedJob.findById(req.params.id);
    
    // Fallback: search by jobId if matching failed
    if (!saved) {
      saved = await SavedJob.findOne({ user: req.user._id, job: req.params.id });
    }

    if (!saved) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    if (saved.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to remove this bookmark' });
    }

    await SavedJob.deleteOne({ _id: saved._id });
    res.json({ message: 'Job removed from saved list successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  saveJob,
  getSavedJobs,
  deleteSavedJob
};
