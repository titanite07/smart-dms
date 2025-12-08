const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'upload', 'download', 'delete', 'restore', 'permanent_delete',
            'share', 'unshare', 'view', 'edit', 'version_upload', 'version_delete',
            'comment_add', 'comment_delete', 'star', 'unstar',
            'folder_create', 'folder_delete', 'folder_restore',
            'move', 'rename', 'public_link_create', 'public_link_revoke',
            'login', 'logout', 'profile_update', 'password_change'
        ]
    },
    resourceType: {
        type: String,
        enum: ['document', 'folder', 'user', 'system'],
        required: true
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'resourceType'
    },
    resourceName: {
        type: String
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { timestamps: true });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ action: 1 });
module.exports = mongoose.model('ActivityLog', activityLogSchema);
