const express = require('express');
const { saveJob, getSavedJobs, deleteSavedJob } = require('../controllers/savedJobController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
  .get(protect, getSavedJobs)
  .post(protect, saveJob);

router.route('/:id')
  .delete(protect, deleteSavedJob);

module.exports = router;
