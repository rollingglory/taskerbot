'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  code: String,
  name: String,
  isActive: { type: Boolean, default: true },
  color: String,
  logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
});

module.exports = mongoose.model('Project', projectSchema);
