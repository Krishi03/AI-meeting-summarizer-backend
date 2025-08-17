const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const Summary = require('../models/summary');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only text files, PDFs, and common document formats
    const allowedTypes = [
      'text/plain',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only text, PDF, Word, and Excel files are allowed.'), false);
    }
  }
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Function to read file content based on file type
async function readFileContent(filePath, mimeType) {
  try {
    if (mimeType === 'text/plain' || mimeType === 'text/csv') {
      // Read text files directly
      return fs.readFileSync(filePath, 'utf8');
    } else if (mimeType === 'application/pdf') {
      // For PDF files, you'll need to install pdf-parse
      // npm install pdf-parse
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (mimeType.includes('word') || mimeType.includes('excel')) {
      // For Word/Excel files, you'll need to install mammoth or xlsx
      // npm install mammoth xlsx
      if (mimeType.includes('word')) {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } else {
        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_txt(worksheet);
      }
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

// Route to upload file and generate summary
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const { customPrompt } = req.body;
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Read file content
    const fileContent = await readFileContent(filePath, mimeType);

    if (!fileContent || fileContent.trim().length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false, 
        error: 'File appears to be empty or could not be read' 
      });
    }

    // Generate summary using Groq
    const systemPrompt = `You are an AI assistant that creates structured summaries from documents. 
    User's custom instruction: ${customPrompt || 'Please provide a comprehensive summary of this document'}
    
    Please analyze the following document content and create a summary based on the user's instruction:`;
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fileContent }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    const summary = completion.choices[0].message.content;
    
    // Save to database
    const newSummary = new Summary({
      originalTranscript: fileContent.substring(0, 1000) + (fileContent.length > 1000 ? '...' : ''), // Store first 1000 chars
      customPrompt: customPrompt || 'Document summary',
      generatedSummary: summary,
      createdAt: new Date(),
      fileName: req.file.originalname,
      fileType: mimeType,
      isFileUpload: true,
    });
    
    const savedSummary = await newSummary.save();
    
    // Clean up uploaded file after processing
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      summary,
      summaryId: savedSummary._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: 'File processed and summary generated successfully'
    });

  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route to get supported file types
router.get('/supported-types', (req, res) => {
  res.json({
    success: true,
    supportedTypes: [
      'text/plain',
      'text/csv', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxFileSize: '10MB'
  });
});

// Backward compatibility route for frontend
router.post('/upload-and-summarize', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const { customPrompt } = req.body;
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Read file content
    const fileContent = await readFileContent(filePath, mimeType);

    if (!fileContent || fileContent.trim().length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        success: false, 
        error: 'File appears to be empty or could not be read' 
      });
    }

    // Generate summary using Groq
    const systemPrompt = `You are an AI assistant that creates structured summaries from documents. 
    User's custom instruction: ${customPrompt || 'Please provide a comprehensive summary of this document'}
    
    Please analyze the following document content and create a summary based on the user's instruction:`;
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fileContent }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    const summary = completion.choices[0].message.content;
    
    // Save to database
    const newSummary = new Summary({
      originalTranscript: fileContent.substring(0, 1000) + (fileContent.length > 1000 ? '...' : ''), // Store first 1000 chars
      customPrompt: customPrompt || 'Document summary',
      generatedSummary: summary,
      createdAt: new Date(),
      fileName: req.file.originalname,
      fileType: mimeType,
      isFileUpload: true,
    });
    
    const savedSummary = await newSummary.save();
    
    // Clean up uploaded file after processing
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      summary,
      summaryId: savedSummary._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      message: 'File processed and summary generated successfully'
    });

  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router; 