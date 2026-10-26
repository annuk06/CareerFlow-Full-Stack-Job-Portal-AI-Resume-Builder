const { getModel } = require('../config/db');

const savedJobSchemaFields = {
  user: { type: String, ref: 'User', required: true },
  job: { type: String, ref: 'Job', required: true }
};

module.exports = getModel('SavedJob', savedJobSchemaFields);
