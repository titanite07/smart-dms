const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const folderRoutes = require('./routes/folders');
const activityRoutes = require('./routes/activity');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));


app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);


const frontendPath = path.join(__dirname, 'public');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));


    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
} else {
    app.get('/', (req, res) => {
        res.json({ message: 'SmartDMS API - Frontend not deployed' });
    });
}

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
