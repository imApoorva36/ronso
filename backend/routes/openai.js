import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST route to summarize text
router.post('/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      console.log('No text provided');
      return res.status(400).json({ message: 'Text is required for summarization' });
    }
    
    console.log(`Summarizing text of length: ${text.length} characters`);
    
    // Make request to OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes conversation between two news anchors concisely and accurately. just focus in the text field of conversation that contains the text of conversation of the news anchors."
        },
        {
          role: "user",
          content: `Please summarize the following text in a concise manner:\n\n${text}`
        }
      ],
      temperature: 0.7,
    });
    
    // Extract the summary from the response
    const summary = response.choices[0].message.content;
    console.log(`Generated summary of length: ${summary.length} characters`);
    
    res.status(200).json({ 
      original_length: text.length,
      summary_length: summary.length,
      summary 
    });
  } catch (error) {
    console.error('Error summarizing text with OpenAI:', error);
    res.status(500).json({ 
      message: 'Failed to summarize text', 
      error: error.message 
    });
  }
});

export default router;
