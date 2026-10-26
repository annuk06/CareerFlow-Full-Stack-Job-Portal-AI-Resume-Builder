const { getModel } = require('../config/db');

const applicationSchemaFields = {
  user: { type: String, ref: 'User', required: true },
  job: { type: String, ref: 'Job', required: true },
  resume: { type: String, ref: 'Resume', required: true },
  status: { 
    type: String, 
    enum: ['Applied', 'Under Review', 'Shortlisted', 'Assessment', 'Interview', 'Selected', 'Rejected'], 
    default: 'Applied' 
  },
  notes: { type: String, default: '' },
  dates: {
    appliedAt: { type: Date, default: Date.now },
    interviewDate: { type: Date },
    assessmentDate: { type: Date }
  }
};

module.exports = getModel('Application', applicationSchemaFields);
