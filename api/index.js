const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from root directory (for local environment)
app.use(express.static(path.join(__dirname, '..')));

// MongoDB Configurations
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'AttendanceDB';
const COLLECTION_NAME = 'submissions';

let dbClient = null;
let submissionsCollection = null;

async function connectToDatabase() {
  if (submissionsCollection) return submissionsCollection;
  
  if (MONGODB_URI) {
    try {
      dbClient = new MongoClient(MONGODB_URI);
      await dbClient.connect();
      const db = dbClient.db(DB_NAME);
      submissionsCollection = db.collection(COLLECTION_NAME);
      console.log('Connected to MongoDB Atlas successfully.');
      return submissionsCollection;
    } catch (err) {
      console.error('Failed to connect to MongoDB Atlas:', err);
      throw err; // Fail loudly in production
    }
  }
  return null;
}

// Database file path for fallback
const DB_FILE = path.join(__dirname, '../submissions.json');

// Helper to read database
async function readDatabase() {
  const collection = await connectToDatabase();
  if (collection) {
    try {
      return await collection.find({}).toArray();
    } catch (err) {
      console.error('Error reading from MongoDB:', err);
    }
  }
  
  // Fallback to JSON file
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading database file:', err);
    return [];
  }
}

// Helper to write database (only used for JSON fallback)
function writeDatabaseJSON(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// Configure Multer for PDF file uploads in Memory
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for serverless functions
});

// API 1: Submit new data
app.post('/api/submissions', upload.single('attachment'), async (req, res) => {
  try {
    const { unitName, startDate, endDate, weeks, notes } = req.body;
    
    if (!unitName || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const parsedWeeks = typeof weeks === 'string' ? JSON.parse(weeks) : weeks;
    const id = Date.now();
    
    const newSubmission = {
      id: id,
      unitName,
      startDate,
      endDate,
      weeks: parsedWeeks,
      notes: notes || '',
      submittedAt: new Date().toISOString(),
      attachment: req.file ? {
        originalName: req.file.originalname,
        filename: `attachment-${id}.pdf`,
        path: `/api/submissions/attachment/${id}`,
        size: req.file.size,
        mimeType: req.file.mimetype,
        data: req.file.buffer.toString('base64')
      } : null
    };

    const collection = await connectToDatabase();
    if (collection) {
      await collection.insertOne(newSubmission);
    } else {
      const submissions = await readDatabase();
      submissions.push(newSubmission);
      writeDatabaseJSON(submissions);
    }

    // Exclude heavy base64 file data from the immediate return payload
    const returnData = { ...newSubmission };
    if (returnData.attachment) {
      delete returnData.attachment.data;
    }

    res.json({ success: true, message: 'Submission saved successfully', data: returnData });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// API 2: Get all submissions (cumulative data)
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await readDatabase();
    // Exclude heavy base64 file data from the list query
    const cleanedSubmissions = submissions.map(sub => {
      const cleaned = { ...sub };
      if (cleaned.attachment) {
        delete cleaned.attachment.data;
      }
      return cleaned;
    });
    res.json({ success: true, data: cleanedSubmissions });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// API 3: Retrieve PDF attachment from Database
app.get('/api/submissions/attachment/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const collection = await connectToDatabase();
    let submission = null;
    
    if (collection) {
      submission = await collection.findOne({ id: id });
    } else {
      const submissions = await readDatabase();
      submission = submissions.find(s => s.id === id);
    }
    
    if (!submission || !submission.attachment || !submission.attachment.data) {
      return res.status(404).send('Attachment not found');
    }
    
    const fileBuffer = Buffer.from(submission.attachment.data, 'base64');
    res.setHeader('Content-Type', submission.attachment.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(submission.attachment.originalName)}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Attachment retrieve error:', error);
    res.status(500).send('Server error retrieving attachment');
  }
});

// API 4: Delete a submission
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const collection = await connectToDatabase();
    
    if (collection) {
      const result = await collection.deleteOne({ id: id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }
    } else {
      let submissions = await readDatabase();
      const index = submissions.findIndex(s => s.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }
      submissions.splice(index, 1);
      writeDatabaseJSON(submissions);
    }
    
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// API 5: Delete all submissions (Clear all)
app.delete('/api/submissions', async (req, res) => {
  try {
    const collection = await connectToDatabase();
    if (collection) {
      await collection.deleteMany({});
    } else {
      writeDatabaseJSON([]);
    }
    res.json({ success: true, message: 'All submissions cleared successfully' });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Route to serve admin panel directly (for local environment)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin.html'));
});

// Fallback to serve index.html for any other requests (for local environment)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
