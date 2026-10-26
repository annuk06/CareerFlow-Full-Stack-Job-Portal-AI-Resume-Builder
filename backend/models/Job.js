const { getModel } = require('../config/db');

const jobSchemaFields = {
  company: { type: String, ref: 'Company', required: true },
  title: { type: String, required: true },
  location: { type: String, required: true },
  workType: { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'On-site' },
  experience: { type: String, required: true },
  salary: { type: String },
  skills: [{ type: String }],
  description: { type: String, required: true },
  responsibilities: [{ type: String }],
  requirements: [{ type: String }],
  benefits: [{ type: String }],
  postedDate: { type: Date, default: Date.now },
  deadline: { type: Date },
  category: { type: String }
};

module.exports = getModel('Job', jobSchemaFields);
