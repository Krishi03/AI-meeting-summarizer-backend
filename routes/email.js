const express = require('express');
const nodemailer = require('nodemailer');
const Summary = require('../models/Summary');
const router = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/', async (req, res) => {
  try {
    const { summaryId, recipients, editedSummary } = req.body;
    
    // Update summary if edited
    if (editedSummary && summaryId) {
      await Summary.findByIdAndUpdate(summaryId, {
        editedSummary,
        lastModified: new Date(),
      });
    }
    
    const emailContent = editedSummary || req.body.summary;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject: 'Meeting Summary - AI Generated',
      html: `
        <h2>Meeting Summary</h2>
        <div style="white-space: pre-wrap; font-family: Arial, sans-serif;">
          ${emailContent.replace(/\n/g, '<br>')}
        </div>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This summary was generated using AI and may have been edited by the sender.
        </p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
