const { getModel } = require('../config/db');

const userSchemaFields = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['candidate', 'admin'], default: 'candidate' }
};

module.exports = getModel('User', userSchemaFields);
