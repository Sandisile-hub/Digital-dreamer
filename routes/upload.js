const express = require('express');
const router = express.Router();
const upload = require('../uploadMiddleware');
const s3 = require('../s3Config');

// Single file upload
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = req.file.location; // S3 file URL
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        key: req.file.key,
        location: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multiple files upload
router.post('/upload-multiple', upload.array('documents', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      originalName: file.originalname,
      key: file.key,
      location: file.location,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file by key
router.get('/file/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    const file = await s3.getObject(params).promise();
    
    // Set appropriate headers
    res.setHeader('Content-Type', file.ContentType);
    res.setHeader('Content-Disposition', `attachment; filename="${key}"`);
    
    res.send(file.Body);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Delete file
router.delete('/file/:key', async (req, res) => {
  try {
    const { key } = req.params;
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;