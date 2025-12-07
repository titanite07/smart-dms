const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getActivityLog, getAllActivityLog, getActivityStats } = require('../controllers/activityController');

router.get('/', protect, getActivityLog);
router.get('/all', protect, getAllActivityLog);
router.get('/stats', protect, getActivityStats);

module.exports = router;
