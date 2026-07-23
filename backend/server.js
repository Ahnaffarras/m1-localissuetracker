const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function db_init() {
  const maxRetries = 5;
  const retryDelay = 3000; // 3 seconds
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id SERIAL PRIMARY KEY,
          reporter_name VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          photo_key VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_reports_id ON reports(id DESC);
      `);
      console.log('Database initialized successfully.');
      return;
    } catch (error) {
      console.error(`Database initialization attempt ${i + 1}/${maxRetries} failed:`, error.message);
      if (i < maxRetries - 1) {
        console.log(`Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('Database initialization failed after all retries. Server will continue but may not function properly.');
      }
    }
  }
}

// S3
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const upload = multer({ storage: multer.memoryStorage() });

// Helpers
async function sendWebhook(isError, data) {
  const owner = process.env.INFO_APP_OWNER || 'Unknown';
  
  let discordPayload = {};
  let telegramText = '';

  if (isError) {
    const errorMsg = `Tracker Error - Deploy by ${owner}\nDetails: ${data}`;
    discordPayload = { content: errorMsg };
    telegramText = errorMsg;
  } else {
    // Success - New Report
    telegramText = `🚨 *New Citizen Report*\n\n*Name:* ${data.reporter_name}\n*Description:* ${data.description}\n\nReported via App | Deployed by ${owner}`;
    
    discordPayload = {
      embeds: [{
        title: "🚨 New Citizen Report",
        color: 3447003,
        fields: [
          { name: "Reporter", value: data.reporter_name, inline: true },
          { name: "Description", value: data.description, inline: false }
        ],
        footer: { text: `Reported via App | Deployed by ${owner}` }
      }]
    };
  }
  
  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });
    } catch (e) { console.error('Discord webhook error', e); }
  }

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: telegramText,
          parse_mode: 'Markdown'
        }),
      });
    } catch (e) { console.error('Telegram webhook error', e); }
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API
app.post('/api/report', upload.single('photo'), async (req, res) => {
  try {
    const { reporter_name, description } = req.body;
    if (!reporter_name || !description || !req.file) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const uuid = crypto.randomUUID();
    const extension = req.file.originalname.split('.').pop();
    const photo_key = `${uuid}.${extension}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: photo_key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const result = await pool.query(
      'INSERT INTO reports (reporter_name, description, photo_key) VALUES ($1, $2, $3) RETURNING *',
      [reporter_name, description, photo_key]
    );

    await sendWebhook(false, { reporter_name, description });

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    await sendWebhook(true, error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/get-list', async (req, res) => {
  try {
    const { last_id } = req.query;
    let query, params;
    
    if (last_id) {
      query = 'SELECT * FROM reports WHERE id < $1 ORDER BY id DESC LIMIT 10';
      params = [parseInt(last_id)];
    } else {
      query = 'SELECT * FROM reports ORDER BY id DESC LIMIT 10';
      params = [];
    }
    
    const result = await pool.query(query, params);
    const data = result.rows.map(row => ({
      ...row,
      photo_url: `/api/image/${row.photo_key}`,
    }));
    
    let next_last_id = null;
    if (data.length > 0) {
      next_last_id = data[data.length - 1].id;
    }
    
    res.json({ success: true, data, next_last_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/image/:key', async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: req.params.key,
    });
    const response = await s3.send(command);
    res.setHeader('Content-Type', response.ContentType);
    response.Body.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(404).send('Not found');
  }
});

// Start server on 0.0.0.0 to accept connections from nginx
app.listen(port, '0.0.0.0', async () => {
  console.log(`Server running on 0.0.0.0:${port}`);
  await db_init();
});
