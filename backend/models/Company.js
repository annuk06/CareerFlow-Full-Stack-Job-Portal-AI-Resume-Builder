const { getModel } = require('../config/db');

const companySchemaFields = {
  name: { type: String, required: true },
  logo: { type: String },
  website: { type: String },
  industry: { type: String },
  description: { type: String },
  location: { type: String }
};

module.exports = getModel('Company', companySchemaFields);
