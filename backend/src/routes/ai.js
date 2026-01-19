const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// All routes require authentication
router.use(authenticateToken);

// POST /api/ai/summarize/:noteId - Generate a summary for a note
router.post('/summarize/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;

    // Fetch the note and verify ownership
    const noteResult = await pool.query(
      'SELECT id, title, content FROM notes WHERE id = $1 AND user_id = $2',
      [noteId, req.user.id]
    );

    if (noteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const note = noteResult.rows[0];

    // Check if note has content to summarize
    if (!note.content || note.content.trim() === '') {
      return res.status(400).json({ message: 'Note has no content to summarize' });
    }

    // Call OpenAI GPT-5.2 API to generate summary
    const completion = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates concise, informative summaries of notes. Your summaries should capture the key points and main ideas while being easy to read. Keep summaries brief but comprehensive.'
        },
        {
          role: 'user',
          content: `Please summarize the following note titled "${note.title}":\n\n${note.content}`
        }
      ],
      max_completion_tokens: 500
    });

    const summary = completion.choices[0].message.content;

    res.json({ 
      noteId: note.id,
      title: note.title,
      summary 
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return res.status(500).json({ message: 'AI service configuration error. Please contact support.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ message: 'AI service is busy. Please try again in a moment.' });
    }
    
    res.status(500).json({ message: 'Failed to generate summary. Please try again.' });
  }
});

module.exports = router;

