const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, resourceType, resourceId, resourceName, details, req) => {
    try {
        await ActivityLog.create({
            user: userId,
            action,
            resourceType,
            resourceId,
            resourceName,
            details,
            ipAddress: req ? (req.ip || req.connection?.remoteAddress) : null,
            userAgent: req ? req.get('User-Agent') : null
        });
    } catch (error) {
        console.error('Failed to log activity:', error.message);
    }
};

const getActivityLog = async (req, res) => {
    try {
        const { page = 1, limit = 50, action, resourceType, startDate, endDate } = req.query;

        const query = { user: req.user._id };

        if (action) query.action = action;
        if (resourceType) query.resourceType = resourceType;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const activities = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('user', 'name email');

        const total = await ActivityLog.countDocuments(query);

        res.json({
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllActivityLog = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const { page = 1, limit = 50, userId, action, resourceType, startDate, endDate } = req.query;

        const query = {};

        if (userId) query.user = userId;
        if (action) query.action = action;
        if (resourceType) query.resourceType = resourceType;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const activities = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('user', 'name email');

        const total = await ActivityLog.countDocuments(query);

        res.json({
            activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActivityStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const stats = await ActivityLog.aggregate([
            { $match: { user: userId, createdAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const dailyActivity = await ActivityLog.aggregate([
            { $match: { user: userId, createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ actionStats: stats, dailyActivity });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    logActivity,
    getActivityLog,
    getAllActivityLog,
    getActivityStats
};
