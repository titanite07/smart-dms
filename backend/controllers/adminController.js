const User = require('../models/User');
const Document = require('../models/Document');
const Folder = require('../models/Folder');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const path = require('path');

const isAdmin = (user) => user.role === 'admin' || user.role === 'superadmin';

const getDashboardStats = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const totalDocuments = await Document.countDocuments({ isDeleted: { $ne: true } });
        const totalFolders = await Folder.countDocuments({ isDeleted: { $ne: true } });
        const trashedDocuments = await Document.countDocuments({ isDeleted: true });

        const storageStats = await Document.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
        ]);
        const totalStorage = storageStats[0]?.totalSize || 0;

        const userStorageStats = await User.aggregate([
            { $group: { _id: null, totalQuota: { $sum: '$storageQuota' }, totalUsed: { $sum: '$storageUsed' } } }
        ]);

        const recentActivity = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'name email');

        const usersByMonth = await User.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 12 }
        ]);

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                totalDocuments,
                totalFolders,
                trashedDocuments,
                totalStorage,
                totalQuota: userStorageStats[0]?.totalQuota || 0,
                totalUsed: userStorageStats[0]?.totalUsed || 0
            },
            recentActivity,
            usersByMonth: usersByMonth.reverse()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { page = 1, limit = 20, search, role, isActive } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const usersWithStats = await Promise.all(users.map(async (user) => {
            const docCount = await Document.countDocuments({ owner: user._id, isDeleted: { $ne: true } });
            const folderCount = await Folder.countDocuments({ owner: user._id, isDeleted: { $ne: true } });
            return {
                ...user.toObject(),
                documentCount: docCount,
                folderCount: folderCount
            };
        }));

        const total = await User.countDocuments(query);

        res.json({
            users: usersWithStats,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { userId } = req.params;
        const { name, role, isActive, storageQuota, company } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Cannot modify superadmin' });
        }

        if (name) user.name = name;
        if (role && req.user.role === 'superadmin') user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (storageQuota) user.storageQuota = storageQuota;
        if (company !== undefined) user.company = company;

        await user.save();

        res.json({ message: 'User updated', user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Superadmin access required' });
        }

        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'superadmin') {
            return res.status(403).json({ message: 'Cannot delete superadmin' });
        }

        const documents = await Document.find({ owner: userId });
        const uploadsDir = path.join(__dirname, '../uploads');

        for (const doc of documents) {
            if (doc.currentPath && fs.existsSync(doc.currentPath)) {
                fs.unlinkSync(doc.currentPath);
            }
            for (const version of doc.versions) {
                if (version.filePath && fs.existsSync(version.filePath)) {
                    fs.unlinkSync(version.filePath);
                }
            }
        }

        await Document.deleteMany({ owner: userId });
        await Folder.deleteMany({ owner: userId });
        await ActivityLog.deleteMany({ user: userId });
        await User.findByIdAndDelete(userId);

        res.json({ message: 'User and all associated data deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStorageReport = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const userStorage = await User.aggregate([
            {
                $project: {
                    name: 1,
                    email: 1,
                    storageUsed: 1,
                    storageQuota: 1,
                    usagePercent: {
                        $cond: {
                            if: { $eq: ['$storageQuota', 0] },
                            then: 0,
                            else: { $multiply: [{ $divide: ['$storageUsed', '$storageQuota'] }, 100] }
                        }
                    }
                }
            },
            { $sort: { storageUsed: -1 } }
        ]);

        const totalStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalQuota: { $sum: '$storageQuota' },
                    totalUsed: { $sum: '$storageUsed' },
                    avgUsage: { $avg: '$storageUsed' }
                }
            }
        ]);

        res.json({
            users: userStorage,
            totals: totalStats[0] || { totalQuota: 0, totalUsed: 0, avgUsage: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const setUserQuota = async (req, res) => {
    try {
        if (!isAdmin(req.user)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { userId } = req.params;
        const { quota } = req.body;

        if (!quota || quota < 0) {
            return res.status(400).json({ message: 'Invalid quota value' });
        }

        const user = await User.findByIdAndUpdate(userId, { storageQuota: quota }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Quota updated', user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUser,
    deleteUser,
    getStorageReport,
    setUserQuota
};
