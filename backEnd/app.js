const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`)
  }
});

const upload = multer({ storage });

// Registration endpoint
app.post('/api/v1/register', upload.fields([
  { name: 'nidImage', maxCount: 1 },
  { name: 'faceImage', maxCount: 1 },
]), (req, res) => {
  console.log('Files:', req.files);
  res.status(200).json({ message: 'Files uploaded successfully' });
});

//Login Endpoint
app.post('/api/v1/login', upload.fields([
  { name: 'nidImage', maxCount: 1 },
  { name: 'faceImage', maxCount: 1 },
]), (req, res) => {
  console.log('Files:', req.files);
  res.status(200).json({ message: 'Files uploaded successfully' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
