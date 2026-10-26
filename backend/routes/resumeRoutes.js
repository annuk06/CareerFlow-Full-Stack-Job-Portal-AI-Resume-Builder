const express = require('express');
const { 
  getResumes, getResumeById, createResume, 
  updateResume, deleteResume, uploadResume 
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getResumes)
  .post(protect, createResume);

router.post('/upload', protect, upload.single('resume'), uploadResume);

router.route('/:id')
  .get(protect, getResumeById)
  .put(protect, updateResume)
  .delete(protect, deleteResume);

module.exports = router;
