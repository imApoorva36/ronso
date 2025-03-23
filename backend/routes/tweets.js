import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Storage paths
const STORAGE_DIR = path.join(process.cwd(), '/storage');
const TWEETS_DIR = path.join(STORAGE_DIR, 'tweets');

// Ensure storage directories exist
fs.ensureDirSync(STORAGE_DIR);
fs.ensureDirSync(TWEETS_DIR);

console.log('Tweets storage directory initialized:', TWEETS_DIR);

// Function to post a tweet
async function postTweet(payload) {
  try {
    console.log("Attempting to post tweet with payload:", payload);
    
    // For tweets with polls
    if (payload.poll) {
      const tweet = await client.v2.tweet(payload.text, {
        poll: {
          duration_minutes: payload.poll.duration_minutes,
          options: payload.poll.options
        }
      });
      console.log(`Tweet with poll posted with ID ${tweet.data.id}`);
      return tweet.data.id;
    } 
    // For regular tweets
    else {
      const tweet = await client.v2.tweet(payload.text);
      console.log(`Tweet posted with ID ${tweet.data.id}`);
      return tweet.data.id;
    }
  } catch (error) {
    console.error(`Failed to post tweet: ${error}`);
    // Log more detailed error information
    if (error.data && error.data.errors) {
      console.error("Twitter API error details:", JSON.stringify(error.data.errors, null, 2));
    }
    return null;
  }
}

// Function to get a tweet by ID
async function getTweet(tweetId) {
  try {
    const options = {
      expansions: ['attachments.poll_ids', 'author_id'],
      'poll.fields': ['options'],
    };
    
    const tweet = await client.v2.singleTweet(tweetId, options);
    console.log(`Retrieved tweet with ID: ${tweetId}`);
    return tweet;
  } catch (error) {
    console.error(`Failed to get tweet: ${error}`);
    return null;
  }
}

// POST a new tweet
router.post('/tweets', async (req, res) => {
  console.log('POST /tweets - Posting a new tweet', req.body);
  try {
    const { text, sessionId } = req.body;
    
    if (!text) {
      console.log('No tweet text provided');
      return res.status(400).json({ message: 'Tweet text is required' });
    }
    
    console.log(`Posting tweet with text: ${text}`);

    // When called from the frontend, we'll just post a simple tweet without a poll
    // This helps avoid rate limiting and duplicate content issues
    const payload = {
        text: text,
        poll: {
            duration_minutes: 1440,
            options: ['yes', 'no']
        }
    }
    
    // Post the tweet using our local function
    const tweetId = await postTweet(payload);
    
    if (!tweetId) {
      console.log('Failed to post tweet');
      return res.status(500).json({ message: 'Failed to post tweet' });
    }
    
    console.log(`Tweet posted with ID ${tweetId}`);
    
    // Save the tweet ID to our local storage
    const tweetsPath = path.join(TWEETS_DIR, 'tweet_ids.json');
    let tweetIds = [];
    
    if (await fs.pathExists(tweetsPath)) {
      tweetIds = await fs.readJson(tweetsPath);
    }
    
    tweetIds.push({
      id: tweetId,
      text,
      sessionId: sessionId || 'unknown', // Store the session ID, default to 'unknown' if not provided
      createdAt: new Date().toISOString()
    });
    
    await fs.writeJson(tweetsPath, tweetIds, { spaces: 2 });
    console.log(`Saved tweet ID ${tweetId} to local storage`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Tweet posted successfully', 
      tweetId 
    });
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).json({ message: 'Failed to post tweet', error: error.message });
  }
});

// GET the latest tweet for a session
router.get('/tweets/session/:sessionId', async (req, res) => {
  console.log(`GET /tweets/session/${req.params.sessionId} - Fetching latest tweet for session`);
  try {
    const sessionId = req.params.sessionId;
    
    if (!sessionId) {
      console.log('No session ID provided');
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    console.log(`Finding latest tweet for session: ${sessionId}`);
    
    // Read the tweet IDs from the JSON file
    const tweetsPath = path.join(TWEETS_DIR, 'tweet_ids.json');
    let tweetIds = [];
    
    if (fs.existsSync(tweetsPath)) {
      tweetIds = JSON.parse(fs.readFileSync(tweetsPath, 'utf8'));
    }
    
    // Find the latest tweet for the given session
    const sessionTweets = tweetIds.filter(tweet => tweet.sessionId === sessionId);
    
    if (sessionTweets.length === 0) {
      return res.status(404).json({ message: 'No tweets found for this session' });
    }
    
    // Sort by creation date (newest first) and get the latest
    sessionTweets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestTweet = sessionTweets[0];
    
    console.log(`Found latest tweet with ID: ${latestTweet.id}`);
    
    // Get the tweet using our local function
    const tweetData = await getTweet(latestTweet.id);
    
    if (!tweetData) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    // Combine tweet data with session information
    const responseData = {
      ...tweetData,
      sessionId: sessionId,
      createdAt: latestTweet.createdAt
    };
    
    // Append the response data to a JSON file in the tweets folder
    const responsesPath = path.join(TWEETS_DIR, 'tweet_responses.json');
    let responses = [];
    
    // Read existing responses if file exists
    if (fs.existsSync(responsesPath)) {
      try {
        responses = JSON.parse(fs.readFileSync(responsesPath, 'utf8'));
      } catch (err) {
        console.error('Error reading responses file:', err);
        // Continue with empty array if file is corrupted
      }
    }
    
    // Add the new response with timestamp
    responses.push({
      ...responseData,
      retrievedAt: new Date().toISOString()
    });
    
    // Write the updated responses back to the file
    fs.writeFileSync(responsesPath, JSON.stringify(responses, null, 2), 'utf8');
    console.log(`Response data appended to ${responsesPath}`);
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching tweet for session:', error);
    res.status(500).json({ message: 'Failed to fetch tweet', error: error.message });
  }
});

// GET a tweet by ID
router.get('/tweets/:id', async (req, res) => {
  console.log(`GET /tweets/${req.params.id} - Fetching tweet`);
  try {
    const tweetId = req.params.id;
    
    if (!tweetId) {
      console.log('No tweet ID provided');
      return res.status(400).json({ message: 'Tweet ID is required' });
    }
    
    console.log(`Fetching tweet with ID: ${tweetId}`);
    
    // Get the tweet using our local function
    const tweet = await getTweet(tweetId);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    res.json(tweet);
  } catch (error) {
    console.error('Error fetching tweet:', error);
    res.status(500).json({ message: 'Failed to fetch tweet', error: error.message });
  }
});

// GET all tweets (from local storage)
router.get('/tweets', async (req, res) => {
  console.log('GET /tweets - Fetching all tweets from local storage');
  try {
    const tweetsPath = path.join(TWEETS_DIR, 'tweet_ids.json');
    
    if (await fs.pathExists(tweetsPath)) {
      const tweets = await fs.readJson(tweetsPath);
      console.log(`Retrieved ${tweets.length} tweets from local storage`);
      return res.json(tweets);
    }
    
    // If no tweets exist, return empty array
    console.log('No tweets found, returning empty array');
    return res.json([]);
  } catch (error) {
    console.error('Error fetching tweets from local storage:', error);
    res.status(500).json({ message: 'Failed to fetch tweets', error: error.message });
  }
});

export default router;
