const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    getAllUsers,
    updateUser,
    deleteUser,
    getStorageReport,
    setUserQuota
} = require('../controllers/adminController');

router.get('/dashboard', protect, getDashboardStats);
router.get('/users', protect, getAllUsers);
router.put('/users/:userId', protect, updateUser);
router.delete('/users/:userId', protect, deleteUser);
router.get('/storage', protect, getStorageReport);
router.put('/users/:userId/quota', protect, setUserQuota);

module.exports = router;
