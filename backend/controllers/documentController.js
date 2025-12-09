const Document = require('../models/Document');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('./activityController');
const uploadDocument = async (req, res) => {
    try {
        const { title, tags, parentFolder } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : []);
        const document = await Document.create({
            title,
            tags: tagsArray,
            owner: req.user._id,
            parentFolder: parentFolder || null,
            currentPath: req.file.path,
            filename: req.file.filename,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            currentVersion: 1,
            versions: []
        });
        await logAccess(document._id, req.user._id);
        await logActivity(req.user._id, 'upload', 'document', document._id, title, { fileSize: req.file.size }, req);
        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const uploadVersion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        const hasEditPermission = document.owner.toString() === req.user._id.toString() ||
            document.sharedWith.some(share =>
                share.user.toString() === req.user._id.toString() && share.permission === 'edit'
            );
        if (!hasEditPermission) {
            return res.status(403).json({ message: 'No permission to edit this document' });
        }
        document.versions.push({
            filePath: document.currentPath,
            versionNumber: document.currentVersion,
            uploadedAt: new Date()
        });
        document.currentPath = req.file.path;
        document.currentVersion += 1;
        await document.save();
        res.json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getDocuments = async (req, res) => {
    try {
        const ownedDocs = await Document.find({ owner: req.user._id, isDeleted: { $ne: true } })
            .populate('owner', 'name email')
            .populate('sharedWith.user', 'name email');
        const sharedDocs = await Document.find({
            'sharedWith.user': req.user._id,
            isDeleted: { $ne: true }
        })
            .populate('owner', 'name email')
            .populate('sharedWith.user', 'name email');
        const allDocs = [...ownedDocs, ...sharedDocs].map(doc => {
            const docObj = doc.toObject();
            docObj.isStarred = doc.starredBy.some(id => id.toString() === req.user._id.toString());
            return docObj;
        });
        res.json(allDocs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const searchDocuments = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const ownedDocs = await Document.find({
            owner: req.user._id,
            isDeleted: { $ne: true },
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ]
        })
            .populate('owner', 'name email')
            .populate('parentFolder', 'name');
        const sharedDocs = await Document.find({
            'sharedWith.user': req.user._id,
            isDeleted: { $ne: true },
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { tags: { $in: [new RegExp(query, 'i')] } }
            ]
        })
            .populate('owner', 'name email')
            .populate('parentFolder', 'name');
        const results = [...ownedDocs, ...sharedDocs].map(doc => {
            const docObj = doc.toObject();
            docObj.isStarred = doc.starredBy.some(id => id.toString() === req.user._id.toString());
            docObj.folderPath = doc.parentFolder ? doc.parentFolder.name : 'Root';
            return docObj;
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const shareDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, permission } = req.body;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the owner can share this document' });
        }
        const userToShare = await User.findOne({ email });
        if (!userToShare) {
            return res.status(404).json({ message: 'User not found' });
        }
        const alreadyShared = document.sharedWith.some(
            share => share.user.toString() === userToShare._id.toString()
        );
        if (alreadyShared) {
            const shareIndex = document.sharedWith.findIndex(
                share => share.user.toString() === userToShare._id.toString()
            );
            document.sharedWith[shareIndex].permission = permission;
        } else {
            document.sharedWith.push({
                user: userToShare._id,
                permission
            });
        }
        await document.save();
        await logActivity(req.user._id, 'share', 'document', document._id, document.title, { sharedWith: email, permission }, req);
        res.json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getVersions = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        const hasAccess = document.owner.toString() === req.user._id.toString() ||
            document.sharedWith.some(share => share.user.toString() === req.user._id.toString());
        if (!hasAccess) {
            return res.status(403).json({ message: 'No permission to access this document' });
        }
        res.json({
            current: {
                filePath: document.currentPath,
                versionNumber: document.currentVersion,
                uploadedAt: document.updatedAt
            },
            versions: document.versions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { version } = req.query;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (req.user) {
            await logAccess(document._id, req.user._id);
            await logActivity(req.user._id, 'download', 'document', document._id, document.title, null, req);
        }
        let filePath;
        if (version) {
            const versionDoc = document.versions.find(v => v.versionNumber === parseInt(version));
            if (!versionDoc) {
                return res.status(404).json({ message: 'Version not found' });
            }
            filePath = versionDoc.filePath;
        } else {
            if (document.filename) {
                filePath = path.join(__dirname, '../uploads', document.filename);
            } else {
                filePath = document.currentPath;
            }
        }
        if (filePath.includes('\\') && path.sep === '/') {
            const parts = filePath.split('\\');
            const fileName = parts[parts.length - 1];
            filePath = path.join(__dirname, '../uploads', fileName);
        }
        if (!fs.existsSync(filePath)) {
            console.error(`File not found at path: ${filePath}`);
            return res.status(404).json({ message: 'File not found on server' });
        }
        const fileExtension = path.extname(filePath);
        let downloadFilename = document.title;
        if (!downloadFilename.toLowerCase().endsWith(fileExtension.toLowerCase())) {
            downloadFilename = document.title + fileExtension;
        }
        if (req.query.inline === 'true') {
            res.sendFile(path.resolve(filePath));
        } else {
            res.download(filePath, downloadFilename);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const logAccess = async (documentId, userId) => {
    try {
        await Document.findByIdAndUpdate(documentId, {
            $push: {
                accessLog: {
                    viewedBy: userId,
                    viewedAt: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Error logging access:', error);
    }
};
const toggleStar = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        const isStarred = document.starredBy.includes(userId);
        if (isStarred) {
            document.starredBy = document.starredBy.filter(id => id.toString() !== userId.toString());
        } else {
            document.starredBy.push(userId);
        }
        await document.save();
        res.json({ isStarred: !isStarred });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can delete documents' });
        }
        document.isDeleted = true;
        document.deletedAt = new Date();
        await document.save();
        await logActivity(req.user._id, 'delete', 'document', document._id, document.title, null, req);
        res.json({ message: 'Document moved to trash' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const deleteVersion = async (req, res) => {
    try {
        const { id, versionId } = req.params;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can delete versions' });
        }
        document.versions = document.versions.filter(v => v._id.toString() !== versionId);
        await document.save();
        res.json({ message: 'Version deleted', versions: document.versions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const moveDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { parentFolder } = req.body;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can move documents' });
        }
        document.parentFolder = parentFolder || null;
        await document.save();
        res.json(document);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getTrash = async (req, res) => {
    try {
        const trashedDocs = await Document.find({
            owner: req.user._id,
            isDeleted: true
        })
            .populate('owner', 'name email')
            .sort({ deletedAt: -1 });
        res.json(trashedDocs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const restoreDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can restore documents' });
        }
        if (!document.isDeleted) {
            return res.status(400).json({ message: 'Document is not in trash' });
        }
        document.isDeleted = false;
        document.deletedAt = null;
        await document.save();
        await logActivity(req.user._id, 'restore', 'document', document._id, document.title, null, req);
        res.json({ message: 'Document restored', document });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const permanentDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can permanently delete documents' });
        }
        await Document.findByIdAndDelete(id);
        res.json({ message: 'Document permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const createPublicLink = async (req, res) => {
    try {
        const { id } = req.params;
        const { permission = 'view', expiresIn, password } = req.body;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can create public links' });
        }
        const token = document.generatePublicLink();
        document.publicLink.permission = permission;
        if (expiresIn) {
            document.publicLink.expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
        }
        if (password) {
            const bcrypt = require('bcryptjs');
            document.publicLink.password = await bcrypt.hash(password, 10);
        }
        await document.save();
        const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const publicUrl = `${baseUrl}/public/${token}`;
        res.json({
            message: 'Public link created',
            link: publicUrl,
            token: token,
            permission: document.publicLink.permission,
            expiresAt: document.publicLink.expiresAt,
            hasPassword: !!password
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const revokePublicLink = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can revoke public links' });
        }
        document.publicLink.isActive = false;
        document.publicLink.token = undefined;
        await document.save();
        res.json({ message: 'Public link revoked' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const accessPublicLink = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.query;
        const document = await Document.findOne({ 'publicLink.token': token, 'publicLink.isActive': true })
            .populate('owner', 'name');
        if (!document) {
            return res.status(404).json({ message: 'Link not found or expired' });
        }
        if (document.publicLink.expiresAt && document.publicLink.expiresAt < new Date()) {
            return res.status(410).json({ message: 'Link has expired' });
        }
        if (document.publicLink.password) {
            if (!password) {
                return res.status(401).json({ message: 'Password required', requiresPassword: true });
            }
            const bcrypt = require('bcryptjs');
            const isValid = await bcrypt.compare(password, document.publicLink.password);
            if (!isValid) {
                return res.status(401).json({ message: 'Invalid password' });
            }
        }
        document.publicLink.viewCount += 1;
        await document.save();
        if (document.publicLink.permission === 'download') {
            const filePath = document.currentPath;
            return res.download(filePath, document.title);
        }
        res.json({
            title: document.title,
            owner: document.owner.name,
            createdAt: document.createdAt,
            permission: document.publicLink.permission,
            viewCount: document.publicLink.viewCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getStorageUsage = async (req, res) => {
    try {
        const documents = await Document.find({ owner: req.user._id, isDeleted: { $ne: true } });
        let totalSize = 0;
        documents.forEach(doc => {
            totalSize += doc.fileSize || 0;
        });
        const user = await User.findById(req.user._id);
        const quota = user.storageQuota || 1073741824;
        const usagePercent = (totalSize / quota) * 100;
        await User.findByIdAndUpdate(req.user._id, { storageUsed: totalSize });
        res.json({
            used: totalSize,
            quota: quota,
            usagePercent: usagePercent.toFixed(2),
            remaining: quota - totalSize,
            documentCount: documents.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = {
    uploadDocument,
    uploadVersion,
    getDocuments,
    searchDocuments,
    shareDocument,
    getVersions,
    downloadFile,
    toggleStar,
    deleteDocument,
    deleteVersion,
    moveDocument,
    getTrash,
    restoreDocument,
    permanentDelete,
    createPublicLink,
    revokePublicLink,
    accessPublicLink,
    getStorageUsage
};