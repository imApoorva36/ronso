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
      'poll.fields': ['duration_minutes', 'end_datetime', 'id', 'options', 'voting_status'],
      'user.fields': ['name', 'username', 'profile_image_url'],
      'tweet.fields': ['created_at', 'public_metrics']
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
    const { text } = req.body;
    
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
            duration_minutes: 30,
            options: ['yes', 'no']
        }
    }
    
    // Post the tweet using our local function
    const tweetId = await postTweet(payload);
    
    if (!tweetId) {
      return res.status(500).json({ message: 'Failed to post tweet' });
    }
    
    // Save tweet ID to local storage for reference
    const tweetsPath = path.join(TWEETS_DIR, 'tweet_ids.json');
    let tweetIds = [];
    
    if (await fs.pathExists(tweetsPath)) {
      tweetIds = await fs.readJson(tweetsPath);
    }
    
    tweetIds.push({
      id: tweetId,
      text,
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
