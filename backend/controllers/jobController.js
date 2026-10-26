const Job = require('../models/Job');
const Company = require('../models/Company');

// Helper to populate company details manually if in fallback mode
const populateJobCompany = async (job) => {
  if (!job) return null;
  const jobObj = typeof job.toObject === 'function' ? job.toObject() : job;
  
  if (Job.isFallback) {
    if (jobObj.company) {
      const company = await Company.findById(jobObj.company);
      jobObj.company = company ? (typeof company.toObject === 'function' ? company.toObject() : company) : null;
    }
  } else {
    // If not fallback, Mongoose handles population, but just in case:
    if (typeof job.populate === 'function') {
      await job.populate('company');
      return job;
    }
  }
  return jobObj;
};

// @desc    Get all jobs with filters, search, and sorting
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  const { search, location, workType, experience, salaryMin, category, sortBy } = req.query;

  try {
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }

    // Additional filters
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (workType) {
      query.workType = workType;
    }
    if (experience) {
      query.experience = experience;
    }
    if (category) {
      query.category = category;
    }

    // Perform DB Query
    let jobs = [];
    if (Job.isFallback) {
      jobs = await Job.find(query);
      
      // Populate company manually
      const populatedJobs = [];
      for (const job of jobs) {
        const popJob = await populateJobCompany(job);
        populatedJobs.push(popJob);
      }
      jobs = populatedJobs;

      // Handle custom sorting in memory for fallback mode
      if (sortBy === 'salary') {
        // Simple numeric extractor for sorting
        const getVal = (sal) => parseInt(sal.replace(/[^0-9]/g, '')) || 0;
        jobs.sort((a, b) => getVal(b.salary || '') - getVal(a.salary || ''));
      } else {
        // Default latest sorting
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    } else {
      // Mongoose DB operations
      let mongooseQuery = Job.find(query).populate('company');
      
      if (sortBy === 'salary') {
        // Custom sort string heuristics or sort parameters
        mongooseQuery = mongooseQuery.sort({ salary: -1 });
      } else {
        mongooseQuery = mongooseQuery.sort({ createdAt: -1 });
      }
      
      jobs = await mongooseQuery;
    }

    res.json(jobs);
  } catch (error) {
    console.error('Get Jobs Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single job by id
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const populated = await populateJobCompany(job);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private/Admin
const createJob = async (req, res) => {
  const { 
    company, title, location, workType, experience, 
    salary, skills, description, responsibilities, 
    requirements, benefits, deadline, category 
  } = req.body;

  try {
    if (!company || !title || !location || !experience || !description) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Verify company exists
    const companyExists = await Company.findById(company);
    if (!companyExists) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const job = await Job.create({
      company,
      title,
      location,
      workType,
      experience,
      salary,
      skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
      description,
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: Array.isArray(benefits) ? benefits : [],
      deadline: deadline ? new Date(deadline) : null,
      category
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private/Admin
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const updated = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private/Admin
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};
