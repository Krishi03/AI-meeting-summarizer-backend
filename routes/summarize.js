const express = require('express');
const Groq = require('groq-sdk');
const Summary = require('../models/Summary');
const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { transcript, customPrompt } = req.body;
    
    const systemPrompt = `You are an AI assistant that creates structured meeting summaries. 
    User's custom instruction: ${customPrompt}
    
    Please analyze the following meeting transcript and create a summary based on the user's instruction:`;
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 2000,
    });
    
    const summary = completion.choices[0].message.content;
    
    // Save to database
    const newSummary = new Summary({
      originalTranscript: transcript,
      customPrompt,
      generatedSummary: summary,
      createdAt: new Date(),
    });
    
    const savedSummary = await newSummary.save();
    
    res.json({
      success: true,
      summary,
      summaryId: savedSummary._id,
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await Summary.findById(id);
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        error: 'Summary not found' 
      });
    }
    
    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error retrieving summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { editedSummary } = req.body;
    
    if (!editedSummary) {
      return res.status(400).json({ 
        success: false, 
        error: 'Edited summary content is required' 
      });
    }
    
    const updatedSummary = await Summary.findByIdAndUpdate(
      id,
      {
        editedSummary,
        lastModified: new Date(),
      },
      { new: true }
    );
    
    if (!updatedSummary) {
      return res.status(404).json({ 
        success: false, 
        error: 'Summary not found' 
      });
    }
    
    res.json({
      success: true,
      summary: updatedSummary,
      message: 'Summary updated successfully'
    });
  } catch (error) {
    console.error('Error updating summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
