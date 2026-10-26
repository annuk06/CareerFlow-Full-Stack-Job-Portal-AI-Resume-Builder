const { getModel } = require('../config/db');

const profileSchemaFields = {
  user: { type: String, ref: 'User', required: true, unique: true },
  personal: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    location: { type: String },
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    photo: { type: String }
  },
  education: [{
    degree: { type: String },
    college: { type: String },
    university: { type: String },
    startYear: { type: String },
    endYear: { type: String },
    cgpa: { type: String }
  }],
  skills: {
    technical: [{ type: String }],
    programmingLanguages: [{ type: String }],
    frameworks: [{ type: String }],
    databases: [{ type: String }],
    tools: [{ type: String }]
  },
  experience: [{
    company: { type: String },
    position: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    description: { type: String }
  }],
  projects: [{
    name: { type: String },
    description: { type: String },
    technologies: [{ type: String }],
    github: { type: String },
    live: { type: String }
  }],
  certifications: [{
    name: { type: String },
    organization: { type: String },
    date: { type: String },
    url: { type: String }
  }],
  achievements: [{
    achievement: { type: String },
    organization: { type: String },
    date: { type: String },
    description: { type: String }
  }]
};

module.exports = getModel('Profile', profileSchemaFields);
