const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  originalTranscript: { type: String, required: true },
  customPrompt: { type: String, required: true },
  generatedSummary: { type: String, required: true },
  editedSummary: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastModified: { type: Date },
  // New fields for file uploads
  fileName: { type: String },
  fileType: { type: String },
  isFileUpload: { type: Boolean, default: false },
});

module.exports = mongoose.model('Summary', summarySchema);
