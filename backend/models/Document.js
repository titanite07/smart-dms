const mongoose = require('mongoose');
const crypto = require('crypto');

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentPath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    mimeType: {
        type: String
    },
    parentFolder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    currentVersion: {
        type: Number,
        default: 1
    },
    versions: [{
        filePath: {
            type: String,
            required: true
        },
        versionNumber: {
            type: Number,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    sharedWith: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permission: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view'
        }
    }],
    publicLink: {
        token: {
            type: String,
            unique: true,
            sparse: true
        },
        permission: {
            type: String,
            enum: ['view', 'download'],
            default: 'view'
        },
        expiresAt: {
            type: Date
        },
        password: {
            type: String
        },
        isActive: {
            type: Boolean,
            default: false
        },
        viewCount: {
            type: Number,
            default: 0
        }
    },
    starredBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    accessLog: [{
        viewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

documentSchema.index({ title: 'text', tags: 'text' });
documentSchema.index({ owner: 1 });
documentSchema.index({ parentFolder: 1 });
documentSchema.index({ 'publicLink.token': 1 });

documentSchema.methods.generatePublicLink = function () {
    this.publicLink.token = crypto.randomBytes(32).toString('hex');
    this.publicLink.isActive = true;
    return this.publicLink.token;
};

module.exports = mongoose.model('Document', documentSchema);
