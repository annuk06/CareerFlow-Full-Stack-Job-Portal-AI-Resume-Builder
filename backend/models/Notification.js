const { getModel } = require('../config/db');

const notificationSchemaFields = {
  user: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // e.g. status, event, deadline, system
  isRead: { type: Boolean, default: false }
};

module.exports = getModel('Notification', notificationSchemaFields);
