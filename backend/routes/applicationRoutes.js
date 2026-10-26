const express = require('express');
const { applyJob, getApplications, updateApplication } = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getApplications)
  .post(protect, applyJob);

router.route('/:id')
  .put(protect, updateApplication);

module.exports = router;
