import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const app = express();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// In-memory session storage (use database in production)
const sessions = new Map();

app.use(express.json());

// Upload endpoint
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const sessionId = uuidv4();
    const files = req.files.map(file => ({
      originalName: file.originalname,
      size: file.size,
      buffer: file.buffer.toString('base64')
    }));

    sessions.set(sessionId, {
      files,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get session endpoint
app.get('/api/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (new Date() > session.expiresAt) {
    sessions.delete(req.params.id);
    return res.status(410).json({ error: 'Session expired' });
  }

  res.json({
    files: session.files.map(f => ({
      originalName: f.originalName,
      size: f.size
    })),
    expiresAt: session.expiresAt
  });
});

// Complete session endpoint
app.post('/api/session/:id/complete', (req, res) => {
  const session = sessions.get(req.params.id);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  sessions.delete(req.params.id);
  res.json({ message: 'Session completed' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;