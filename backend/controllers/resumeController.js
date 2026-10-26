const Resume = require('../models/Resume');
const { extractTextFromFile, parseResumeText } = require('../services/pdfParserService');
const fs = require('fs');

// @desc    Get all resumes of user
// @route   GET /api/resumes
// @access  Private
const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single resume by id
// @route   GET /api/resumes/:id
// @access  Private
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.id || req.params.id);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    
    // Check ownership
    if (resume.user !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this resume' });
    }

    res.json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create/Save a resume
// @route   POST /api/resumes
// @access  Private
const createResume = async (req, res) => {
  const { title, resumeData, template } = req.body;

  try {
    if (!resumeData) {
      return res.status(400).json({ message: 'Resume data is required.' });
    }

    const resume = await Resume.create({
      user: req.user._id,
      title: title || 'My Resume',
      resumeData,
      template: template || 'modern',
      isExtracted: false
    });

    res.status(201).json(resume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a resume
// @route   PUT /api/resumes/:id
// @access  Private
const updateResume = async (req, res) => {
  const { title, resumeData, template } = req.body;

  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.user !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this resume' });
    }

    if (title !== undefined) resume.title = title;
    if (resumeData !== undefined) resume.resumeData = resumeData;
    if (template !== undefined) resume.template = template;

    const updatedResume = await resume.save();
    res.json(updatedResume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.user !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this resume' });
    }

    // If file exists physically, delete it
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      try {
        fs.unlinkSync(resume.filePath);
      } catch (err) {
        console.error('Failed to delete physical resume file:', err);
      }
    }

    await Resume.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload and extract text from resume PDF/DOCX
// @route   POST /api/resumes/upload
// @access  Private
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file (PDF, DOC, or DOCX).' });
    }

    const filePath = req.file.path;
    let extractedText = '';
    let extractedData = {};

    try {
      extractedText = await extractTextFromFile(filePath);
      extractedData = parseResumeText(extractedText);
    } catch (parseError) {
      console.error('Text extraction failed:', parseError);
      // Fallback placeholder structure to ensure resilience
      extractedData = {
        personal: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '',
          location: '',
          linkedin: '',
          github: '',
          portfolio: '',
          summary: 'Unable to parse details from PDF automatically. Please fill details manually.'
        },
        education: [],
        skills: { technical: [], programmingLanguages: [], frameworks: [], databases: [], tools: [] },
        experience: [],
        projects: [],
        certifications: [],
        achievements: []
      };
    }

    // Save PDF reference details in database
    const savedResume = await Resume.create({
      user: req.user._id,
      title: `Uploaded: ${req.file.originalname}`,
      resumeData: extractedData,
      template: 'ats',
      filePath: filePath,
      isExtracted: true
    });

    // Send data to user along with the UI required alerts
    res.status(200).json({
      message: 'Resume uploaded successfully',
      subMessage: 'Review extracted information before saving.',
      resumeId: savedResume._id,
      extractedData: extractedData
    });

  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  uploadResume
};
