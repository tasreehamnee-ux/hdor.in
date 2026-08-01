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
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Serve static files from root directory (for local environment)
app.use(express.static(path.join(__dirname, '..')));

// Database Types
const DB_TYPE = {
  FIREBASE_FIRESTORE: 'firebase_firestore',
  FIREBASE_RTDB: 'firebase_rtdb',
  MONGODB: 'mongodb',
  LOCAL: 'local'
};

let activeDbType = DB_TYPE.LOCAL;
let dbInitialized = false;

// MongoDB configurations
let dbClient = null;
let submissionsCollection = null;
const DB_NAME = 'AttendanceDB';
const COLLECTION_NAME = 'submissions';

// Firebase configurations (SDK mode)
let firestoreDb = null;
let realtimeDb = null;
let storageBucket = null;

// Firebase configurations (REST mode)
const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL;
const FIREBASE_DB_SECRET = process.env.FIREBASE_DATABASE_SECRET;

// Helper to construct Firebase REST URL
function getFirebaseRestUrl(path) {
  let url = `${FIREBASE_DB_URL}/${path}.json`;
  if (FIREBASE_DB_SECRET) {
    url += `?auth=${FIREBASE_DB_SECRET}`;
  }
  return url;
}

// Database file path for local fallback
const DB_FILE = path.join(__dirname, '../submissions.json');

// Initialize database connection based on environment variables
async function initDatabase() {
  if (dbInitialized) return;

  // 1. Try Firebase SDK mode first (Firestore or Realtime Database via Service Account)
  if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PRIVATE_KEY) {
    try {
      const admin = require('firebase-admin');
      
      // Prevent initializing multiple apps in development/hot-reloads
      if (admin.apps.length === 0) {
        let credential;
        let projectId = '';
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          credential = admin.credential.cert(serviceAccount);
          projectId = serviceAccount.project_id;
        } else {
          credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          });
          projectId = process.env.FIREBASE_PROJECT_ID;
        }
        
        const config = { credential };
        if (process.env.FIREBASE_STORAGE_BUCKET) {
          config.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
        }
        
        const rtdbUrl = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;
        config.databaseURL = rtdbUrl;
        
        admin.initializeApp(config);
      }
      
      // Determine database type to use (Realtime DB or Cloud Firestore)
      if (process.env.FIREBASE_DATABASE_URL || process.env.FIREBASE_USE_RTDB === 'true') {
        realtimeDb = admin.database();
        activeDbType = DB_TYPE.FIREBASE_RTDB;
        console.log('Firebase Realtime Database (SDK Mode) initialized successfully.');
      } else {
        firestoreDb = admin.firestore();
        activeDbType = DB_TYPE.FIREBASE_FIRESTORE;
        console.log('Firebase Firestore (SDK Mode) initialized successfully.');
      }
      
      if (process.env.FIREBASE_STORAGE_BUCKET) {
        storageBucket = admin.storage().bucket();
      }
      
      dbInitialized = true;
      return;
    } catch (err) {
      console.error('Failed to initialize Firebase SDK, falling back to REST/MongoDB:', err);
    }
  }

  // 2. Try Firebase REST mode (Realtime Database without Service Account Key)
  if (FIREBASE_DB_URL) {
    activeDbType = DB_TYPE.FIREBASE_RTDB;
    console.log('Firebase Realtime Database (REST Mode) active.');
    dbInitialized = true;
    return;
  }

  // 3. Try MongoDB Atlas next
  if (process.env.MONGODB_URI) {
    try {
      dbClient = new MongoClient(process.env.MONGODB_URI);
      await dbClient.connect();
      const db = dbClient.db(DB_NAME);
      submissionsCollection = db.collection(COLLECTION_NAME);
      activeDbType = DB_TYPE.MONGODB;
      console.log('Connected to MongoDB Atlas successfully.');
      dbInitialized = true;
      return;
    } catch (err) {
      console.error('Failed to connect to MongoDB Atlas:', err);
      throw err; // Fail loudly in production
    }
  }

  // 4. Fallback to Local JSON
  activeDbType = DB_TYPE.LOCAL;
  console.log('Using Local JSON File fallback.');
  dbInitialized = true;
}

// Database helper functions
async function getAllSubmissions() {
  await initDatabase();
  
  if (activeDbType === DB_TYPE.FIREBASE_FIRESTORE) {
    const snapshot = await firestoreDb.collection(COLLECTION_NAME).get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    list.sort((a, b) => b.id - a.id);
    return list;
  }
  
  if (activeDbType === DB_TYPE.FIREBASE_RTDB) {
    if (realtimeDb) {
      // SDK mode
      const snapshot = await realtimeDb.ref(COLLECTION_NAME).once('value');
      const val = snapshot.val();
      if (!val) return [];
      const list = Object.values(val);
      list.sort((a, b) => b.id - a.id);
      return list;
    }
    
    // REST mode
    try {
      const response = await fetch(getFirebaseRestUrl(COLLECTION_NAME));
      if (!response.ok) {
        throw new Error(`Firebase REST error: ${response.status} ${response.statusText}`);
      }
      const val = await response.json();
      if (!val) return [];
      const list = Object.values(val);
      list.sort((a, b) => b.id - a.id);
      return list;
    } catch (err) {
      console.error('Error fetching from Firebase RTDB REST:', err);
      throw err;
    }
  }
  
  if (activeDbType === DB_TYPE.MONGODB) {
    const list = await submissionsCollection.find({}).toArray();
    list.sort((a, b) => b.id - a.id);
    return list;
  }
  
  // Local JSON File
  if (!fs.existsSync(DB_FILE)) return [];
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const list = JSON.parse(data || '[]');
    list.sort((a, b) => b.id - a.id);
    return list;
  } catch (err) {
    console.error('Error reading database file:', err);
    return [];
  }
}

async function getSubmissionById(id) {
  await initDatabase();
  
  if (activeDbType === DB_TYPE.FIREBASE_FIRESTORE) {
    const doc = await firestoreDb.collection(COLLECTION_NAME).doc(id.toString()).get();
    return doc.exists ? doc.data() : null;
  }
  
  if (activeDbType === DB_TYPE.FIREBASE_RTDB) {
    if (realtimeDb) {
      // SDK mode
      const snapshot = await realtimeDb.ref(`${COLLECTION_NAME}/${id}`).once('value');
      return snapshot.val();
    }
    
    // REST mode
    try {
      const response = await fetch(getFirebaseRestUrl(`${COLLECTION_NAME}/${id}`));
      if (!response.ok) {
        throw new Error(`Firebase REST error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching submission from Firebase RTDB REST:', err);
      throw err;
    }
  }
  
  if (activeDbType === DB_TYPE.MONGODB) {
    return await submissionsCollection.findOne({ id: id });
  }
  
  const list = await getAllSubmissions();
  return list.find(s => s.id === id) || null;
}

const ATTACHMENTS_COLLECTION = 'submissions_attachments';

async function saveAttachmentData(id, buffer, mimeType, originalName) {
  await initDatabase();
  const base64Data = buffer.toString('base64');
  const chunkSize = 2 * 1024 * 1024; // 2MB chunk
  const totalChunks = Math.ceil(base64Data.length / chunkSize);

  const meta = {
    id: id.toString(),
    mimeType: mimeType || 'application/pdf',
    originalName: originalName || 'attachment.pdf',
    totalChunks: totalChunks,
    size: buffer.length
  };

  if (activeDbType === DB_TYPE.FIREBASE_RTDB) {
    if (realtimeDb) {
      await realtimeDb.ref(`${ATTACHMENTS_COLLECTION}/${id}/meta`).set(meta);
      for (let i = 0; i < totalChunks; i++) {
        const chunkStr = base64Data.substring(i * chunkSize, (i + 1) * chunkSize);
        await realtimeDb.ref(`${ATTACHMENTS_COLLECTION}/${id}/chunks/${i}`).set(chunkStr);
      }
    } else {
      await fetch(getFirebaseRestUrl(`${ATTACHMENTS_COLLECTION}/${id}/meta`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meta)
      });
      for (let i = 0; i < totalChunks; i++) {
        const chunkStr = base64Data.substring(i * chunkSize, (i + 1) * chunkSize);
        await fetch(getFirebaseRestUrl(`${ATTACHMENTS_COLLECTION}/${id}/chunks/${i}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunkStr)
        });
      }
    }
    return;
  }

  if (activeDbType === DB_TYPE.FIREBASE_FIRESTORE) {
    await firestoreDb.collection(ATTACHMENTS_COLLECTION).doc(id.toString()).set({
      ...meta,
      data: base64Data
    });
    return;
  }

  if (activeDbType === DB_TYPE.MONGODB) {
    const db = dbClient.db(DB_NAME);
    await db.collection(ATTACHMENTS_COLLECTION).updateOne(
      { id: id.toString() },
      { $set: { ...meta, data: base64Data } },
      { upsert: true }
    );
    return;
  }

  // Filesystem fallback
  const attachDir = path.join(__dirname, '../uploads/attachments');
  if (!fs.existsSync(attachDir)) fs.mkdirSync(attachDir, { recursive: true });
  fs.writeFileSync(path.join(attachDir, `attachment-${id}.pdf`), buffer);
}

async function getAttachmentBuffer(id) {
  await initDatabase();

  if (activeDbType === DB_TYPE.FIREBASE_RTDB) {
    let chunks = null;
    if (realtimeDb) {
      const snap = await realtimeDb.ref(`${ATTACHMENTS_COLLECTION}/${id}`).once('value');
      const val = snap.val();
      if (val) chunks = val.chunks;
    } else {
      const resp = await fetch(getFirebaseRestUrl(`${ATTACHMENTS_COLLECTION}/${id}`));
      if (resp.ok) {
        const val = await resp.json();
        if (val) chunks = val.chunks;
      }
    }

    if (chunks) {
      let fullBase64 = '';
      if (Array.isArray(chunks)) {
        fullBase64 = chunks.join('');
      } else if (typeof chunks === 'object') {
        fullBase64 = Object.values(chunks).join('');
      }
      if (fullBase64) {
        return Buffer.from(fullBase64, 'base64');
      }
    }
  }

  if (activeDbType === DB_TYPE.FIREBASE_FIRESTORE) {
    const doc = await firestoreDb.collection(ATTACHMENTS_COLLECTION).doc(id.toString()).get();
    if (doc.exists && doc.data().data) {
      return Buffer.from(doc.data().data, 'base64');
    }
  }

  if (activeDbType === DB_TYPE.MONGODB) {
    const db = dbClient.db(DB_NAME);
    const doc = await db.collection(ATTACHMENTS_COLLECTION).findOne({ id: id.toString() });
    if (doc && doc.data) {
      return Buffer.from(doc.data, 'base64');
    }
  }

  const attachFile = path.join(__dirname, `../uploads/attachments/attachment-${id}.pdf`);
  if (fs.existsSync(attachFile)) {
    return fs.readFileSync(attachFile);
  }

  return null;
}

async function saveSubmission(submission) {
  await initDatabase();
  
  if (activeDbType === DB_TYPE.FIREBASE_FIRESTORE) {
    await firestoreDb.collection(COLLECTION_NAME).doc(submission.id.toString()).set(submission);
    return;
  }
  
  if (activeDbType === DB_TYPE.FIREBASE_RTDB) {
    if (realtimeDb) {
      // SDK mode
      await realtimeDb.ref(`${COLLECTION_NAME}/${submission.id}`).set(submission);
      return;
    }
    
    // REST mode
    try {
      const response = await fetch(getFirebaseRestUrl(`${COLLECTION_NAME}/${submission.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });
      if (!response.ok) {
        throw new Error(`Firebase REST error: ${response.status} ${response.statusText}`);
      }
      return;
    } catch (err) {
      console.error('Error saving submission to Firebase RTDB REST:', err);
      throw err;
    }
  }
  
  if (activeDbType === DB_TYPE.MONGODB) {
    await submissionsCollection.insertOne(submission);
    return;
  }
  
  const list = await getAllSubmissions();
  list.push(submission);
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
}

async function deleteSubmission(id) {
  await initDatabase();
  
  if (activeDbType === DB_TYPE.FIREBASE_FIRESTORE) {
    const docRef = firestoreDb.collection(COLLECTION_NAME).doc(id.toString());
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }
  
  if (activeDbType === DB_TYPE.FIREBASE_RTDB) {
    if (realtimeDb) {
      // SDK mode
      const ref = realtimeDb.ref(`${COLLECTION_NAME}/${id}`);
      const snapshot = await ref.once('value');
      if (!snapshot.exists()) return false;
      await ref.remove();
      return true;
    }
    
    // REST mode
    try {
      const checkResponse = await fetch(getFirebaseRestUrl(`${COLLECTION_NAME}/${id}`));
      const val = await checkResponse.json();
      if (!val) return false;
      
      const response = await fetch(getFirebaseRestUrl(`${COLLECTION_NAME}/${id}`), {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Firebase REST error: ${response.status} ${response.statusText}`);
      }
      return true;
    } catch (err) {
      console.error('Error deleting submission from Firebase RTDB REST:', err);
      throw err;
    }
  }
  
  if (activeDbType === DB_TYPE.MONGODB) {
    const result = await submissionsCollection.deleteOne({ id: id });
    return result.deletedCount > 0;
  }
  
  const list = await getAllSubmissions();
  const index = list.findIndex(s => s.id === id);
  if (index === -1) return false;
  list.splice(index, 1);
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
  return true;
}

async function clearAllSubmissions() {
  await initDatabase();
  
  if (activeDbType === DB_TYPE.FIREBASE_FIRESTORE) {
    const snapshot = await firestoreDb.collection(COLLECTION_NAME).get();
    const batch = firestoreDb.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return;
  }
  
  if (activeDbType === DB_TYPE.FIREBASE_RTDB) {
    if (realtimeDb) {
      // SDK mode
      await realtimeDb.ref(COLLECTION_NAME).remove();
      return;
    }
    
    // REST mode
    try {
      const response = await fetch(getFirebaseRestUrl(COLLECTION_NAME), {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Firebase REST error: ${response.status} ${response.statusText}`);
      }
      return;
    } catch (err) {
      console.error('Error clearing database in Firebase RTDB REST:', err);
      throw err;
    }
  }
  
  if (activeDbType === DB_TYPE.MONGODB) {
    await submissionsCollection.deleteMany({});
    return;
  }
  
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');
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
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// API 1: Submit new data
// Helper to update governorate compiled file
async function updateGovernorateFile(unitName, newWeeks) {
  try {
    const govDir = path.join(__dirname, '../uploads/governorates');
    if (!fs.existsSync(govDir)) {
      fs.mkdirSync(govDir, { recursive: true });
    }
    
    // Normalize unitName for safe filename
    const safeUnitName = unitName.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const filepath = path.join(govDir, `${safeUnitName}.json`);
    
    let compiledWeeks = {};
    if (fs.existsSync(filepath)) {
      try {
        const raw = fs.readFileSync(filepath, 'utf8');
        compiledWeeks = JSON.parse(raw || '{}');
      } catch (e) {
        console.error('Error reading governorate file:', e);
      }
    }
    
    // Merge new weeks
    if (newWeeks && typeof newWeeks === 'object') {
      Object.keys(newWeeks).forEach(key => {
        const val = newWeeks[key];
        if (val !== null && val !== undefined) {
          compiledWeeks[key] = val;
        }
      });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(compiledWeeks, null, 2), 'utf8');
    console.log(`Updated governorate file for ${unitName} at ${filepath}`);
  } catch (err) {
    console.error('Failed to update governorate file:', err);
  }
}

// API 0: Chunked upload for large attachments
const uploadSessions = {};
app.post('/api/submissions/upload-chunk', (req, res, next) => {
  upload.single('chunk')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Chunk upload error: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, originalName } = req.body;
    if (!uploadId || chunkIndex === undefined || !totalChunks || !req.file) {
      return res.status(400).json({ success: false, message: 'Missing chunk parameters' });
    }

    const cIdx = parseInt(chunkIndex);
    const tChunks = parseInt(totalChunks);

    if (!uploadSessions[uploadId]) {
      uploadSessions[uploadId] = {
        chunks: [],
        originalName: originalName || 'attachment.pdf',
        mimeType: req.file.mimetype || 'application/pdf',
        receivedCount: 0
      };
    }

    const session = uploadSessions[uploadId];
    session.chunks[cIdx] = req.file.buffer;
    session.receivedCount++;

    if (session.receivedCount === tChunks) {
      const finalBuffer = Buffer.concat(session.chunks);
      await saveAttachmentData(uploadId, finalBuffer, session.mimeType, session.originalName);
      delete uploadSessions[uploadId];
      return res.json({ success: true, attachmentId: uploadId, complete: true });
    }

    res.json({ success: true, attachmentId: uploadId, complete: false });
  } catch (err) {
    console.error('Chunk upload error:', err);
    res.status(500).json({ success: false, message: 'Error processing chunk: ' + err.message });
  }
});

// API 1: Submit new data
app.post('/api/submissions', (req, res, next) => {
  upload.single('attachment')(req, res, (err) => {
    if (err) {
      console.warn('Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'حجم الملف المرفق كبير جداً بالنسبة للسيرفر (الحد الأقصى 200 ميجابايت)'
        });
      }
      return res.status(400).json({ success: false, message: 'خطأ في رفع الملف المرفق: ' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { unitName, startDate, endDate, weeks, notes, attachmentId } = req.body;
    
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
      attachment: null
    };

    if (req.file) {
      newSubmission.attachment = {
        originalName: req.file.originalname,
        filename: `attachment-${id}.pdf`,
        path: `/api/submissions/attachment/${id}`,
        size: req.file.size,
        mimeType: req.file.mimetype
      };

      await initDatabase();
      if (activeDbType.startsWith('firebase') && storageBucket) {
        const fileRef = storageBucket.file(`attachments/attachment-${id}.pdf`);
        await fileRef.save(req.file.buffer, {
          contentType: req.file.mimetype,
          resumable: false,
          metadata: {
            originalName: req.file.originalname,
            submissionId: id
          }
        });
      } else {
        await saveAttachmentData(id, req.file.buffer, req.file.mimetype, req.file.originalname);
      }
    } else if (attachmentId) {
      const attachBuf = await getAttachmentBuffer(attachmentId);
      if (attachBuf) {
        await saveAttachmentData(id, attachBuf, 'application/pdf', req.body.attachmentName || 'attachment.pdf');
        newSubmission.attachment = {
          originalName: req.body.attachmentName || 'attachment.pdf',
          filename: `attachment-${id}.pdf`,
          path: `/api/submissions/attachment/${id}`,
          size: attachBuf.length,
          mimeType: 'application/pdf'
        };
      }
    } else if (req.body.attachmentInfo) {
      try {
        const info = typeof req.body.attachmentInfo === 'string' ? JSON.parse(req.body.attachmentInfo) : req.body.attachmentInfo;
        newSubmission.attachment = {
          originalName: info.originalName || info.name || 'attachment.pdf',
          filename: `attachment-${id}.pdf`,
          path: `/api/submissions/attachment/${id}`,
          size: info.size || 0,
          type: info.type || 'application/pdf',
          note: info.note || 'ملف محفوظ محلياً في جهاز المرسل'
        };
      } catch (e) {
        console.error('Error parsing attachmentInfo:', e);
      }
    }

    await saveSubmission(newSubmission);
    await updateGovernorateFile(unitName, parsedWeeks);

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

// API 1b: Get compiled governorate file
app.get('/api/governorates/:name', (req, res) => {
  try {
    const name = req.params.name;
    const safeUnitName = name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
    const filepath = path.join(__dirname, `../uploads/governorates/${safeUnitName}.json`);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Governorate file not found' });
    }
    const raw = fs.readFileSync(filepath, 'utf8');
    res.json({ success: true, data: JSON.parse(raw || '{}') });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API 2: Get all submissions (cumulative data)
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
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

// API 3: Retrieve PDF attachment from Database or Storage
app.get('/api/submissions/attachment/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const submission = await getSubmissionById(id);
    
    if (!submission || !submission.attachment) {
      return res.status(404).send('Attachment not found');
    }
    
    let fileBuffer;
    if (submission.attachment.data) {
      fileBuffer = Buffer.from(submission.attachment.data, 'base64');
    } else if (activeDbType.startsWith('firebase') && storageBucket) {
      const fileRef = storageBucket.file(`attachments/attachment-${id}.pdf`);
      const [exists] = await fileRef.exists();
      if (exists) {
        const [downloadedBuffer] = await fileRef.download();
        fileBuffer = downloadedBuffer;
      }
    }
    
    if (!fileBuffer) {
      fileBuffer = await getAttachmentBuffer(id);
    }
    
    if (!fileBuffer) {
      return res.status(404).send('Attachment file data not found');
    }

    const origName = submission.attachment.originalName || 'attachment.pdf';
    res.setHeader('Content-Type', submission.attachment.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(origName)}"`);
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
    
    // Check if we need to delete from Firebase Storage first
    await initDatabase();
    if (activeDbType.startsWith('firebase') && storageBucket) {
      try {
        const fileRef = storageBucket.file(`attachments/attachment-${id}.pdf`);
        const [exists] = await fileRef.exists();
        if (exists) {
          await fileRef.delete();
          console.log(`Deleted attachment-${id}.pdf from Firebase Storage`);
        }
      } catch (storageErr) {
        console.error('Error deleting file from Firebase Storage:', storageErr);
      }
    }

    const deleted = await deleteSubmission(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
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
    await initDatabase();
    
    // If Firebase Storage is active, clear all files in attachments/ prefix
    if (activeDbType.startsWith('firebase') && storageBucket) {
      try {
        await storageBucket.deleteFiles({ prefix: 'attachments/' });
        console.log('Cleared all files from Firebase Storage');
      } catch (storageErr) {
        console.error('Error clearing files from Firebase Storage:', storageErr);
      }
    }

    await clearAllSubmissions();
    res.json({ success: true, message: 'All submissions cleared successfully' });
  } catch (error) {
    console.error('Clear all error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
});

// Route to inspect environment variable state
app.get('/api/test-env', async (req, res) => {
  try {
    await initDatabase();
  } catch (err) {
    // Continue even if database connection fails so env status is visible
  }

  const rawUri = process.env.MONGODB_URI;
  let maskedUri = 'undefined';
  if (rawUri !== undefined) {
    maskedUri = rawUri.replace(/[a-zA-Z0-9]/g, '*');
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  let maskedServiceAccount = 'undefined';
  if (rawServiceAccount !== undefined) {
    maskedServiceAccount = rawServiceAccount.replace(/[a-zA-Z0-9]/g, '*');
  }

  res.json({
    activeDatabaseType: activeDbType,
    databaseInitialized: dbInitialized,
    
    // MongoDB
    mongodbUriDefined: !!rawUri,
    mongodbUriLength: rawUri ? rawUri.length : 0,
    mongodbUriType: typeof rawUri,
    mongodbUriMasked: maskedUri,
    
    // Firebase
    firebaseServiceAccountDefined: !!rawServiceAccount,
    firebaseServiceAccountLength: rawServiceAccount ? rawServiceAccount.length : 0,
    firebaseServiceAccountMasked: maskedServiceAccount,
    firebaseStorageBucketDefined: !!process.env.FIREBASE_STORAGE_BUCKET,
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || null,
    firebaseDatabaseUrlDefined: !!process.env.FIREBASE_DATABASE_URL,
    firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || null,
    
    allEnvKeys: Object.keys(process.env)
  });
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
