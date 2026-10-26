const { getModel } = require('../config/db');

const eventSchemaFields = {
  user: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Interview', 'Assessment', 'Application deadline', 'Job fair', 'Career event'],
    required: true 
  },
  date: { type: Date, required: true },
  description: { type: String },
  reminder: { type: Boolean, default: false }
};

module.exports = getModel('Event', eventSchemaFields);
