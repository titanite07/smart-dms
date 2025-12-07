const Folder = require('../models/Folder');
const Document = require('../models/Document');
const { logActivity } = require('./activityController');

const createFolder = async (req, res) => {
    try {
        const { name, parentFolder } = req.body;

        const folder = await Folder.create({
            name,
            owner: req.user._id,
            parentFolder: parentFolder || null
        });
        await logActivity(req.user._id, 'folder_create', 'folder', folder._id, name, null, req);

        res.status(201).json(folder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFolderContents = async (req, res) => {
    try {
        const { folderId } = req.params;
        const currentFolderId = folderId !== 'root' ? folderId : null;

        const folders = await Folder.find({
            owner: req.user._id,
            parentFolder: currentFolderId,
            isDeleted: { $ne: true }
        }).populate('owner', 'name email');

        const documents = await Document.find({
            owner: req.user._id,
            parentFolder: currentFolderId,
            isDeleted: { $ne: true }
        }).populate('owner', 'name email');

        const mappedDocs = documents.map(doc => {
            const docObj = doc.toObject();
            docObj.isStarred = doc.starredBy && doc.starredBy.some(id => id.toString() === req.user._id.toString());
            return docObj;
        });

        let currentFolder = null;
        let breadcrumbs = [];

        if (currentFolderId) {
            currentFolder = await Folder.findById(currentFolderId);
            if (currentFolder) {
                breadcrumbs.push({ id: currentFolder._id, name: currentFolder.name });
            }
        }

        res.json({
            folders,
            documents: mappedDocs,
            currentFolder,
            breadcrumbs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;

        const folder = await Folder.findOne({ _id: id, owner: req.user._id });
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        folder.isDeleted = true;
        folder.deletedAt = new Date();
        await folder.save();

        await Document.updateMany(
            { parentFolder: id, owner: req.user._id },
            { isDeleted: true, deletedAt: new Date() }
        );

        const subfolders = await Folder.find({ parentFolder: id, owner: req.user._id });
        for (const subfolder of subfolders) {
            subfolder.isDeleted = true;
            subfolder.deletedAt = new Date();
            await subfolder.save();
        }
        await logActivity(req.user._id, 'delete', 'folder', folder._id, folder.name, null, req);

        res.json({ message: 'Folder moved to trash' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTrashFolders = async (req, res) => {
    try {
        const folders = await Folder.find({
            owner: req.user._id,
            isDeleted: true
        }).populate('owner', 'name email').sort({ deletedAt: -1 });

        res.json(folders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const restoreFolder = async (req, res) => {
    try {
        const { id } = req.params;

        const folder = await Folder.findOne({ _id: id, owner: req.user._id, isDeleted: true });
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found in trash' });
        }

        folder.isDeleted = false;
        folder.deletedAt = null;
        await folder.save();

        await Document.updateMany(
            { parentFolder: id, owner: req.user._id, isDeleted: true },
            { isDeleted: false, deletedAt: null }
        );

        const subfolders = await Folder.find({ parentFolder: id, owner: req.user._id, isDeleted: true });
        for (const subfolder of subfolders) {
            subfolder.isDeleted = false;
            subfolder.deletedAt = null;
            await subfolder.save();
        }
        await logActivity(req.user._id, 'restore', 'folder', folder._id, folder.name, null, req);

        res.json({ message: 'Folder restored successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const permanentDeleteFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const fs = require('fs');
        const path = require('path');

        const folder = await Folder.findOne({ _id: id, owner: req.user._id, isDeleted: true });
        if (!folder) {
            return res.status(404).json({ message: 'Folder not found in trash' });
        }

        const documents = await Document.find({ parentFolder: id, owner: req.user._id });
        for (const doc of documents) {
            const filePath = path.join(__dirname, '..', 'uploads', doc.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await Document.deleteMany({ parentFolder: id, owner: req.user._id });

        await Folder.deleteMany({ parentFolder: id, owner: req.user._id });

        await Folder.findByIdAndDelete(id);

        res.json({ message: 'Folder permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const moveFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const { parentFolder } = req.body;

        const folder = await Folder.findById(id);

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found' });
        }

        if (folder.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only owner can move folders' });
        }

        if (parentFolder === id) {
            return res.status(400).json({ message: 'Cannot move folder into itself' });
        }

        if (parentFolder) {
            const targetFolder = await Folder.findById(parentFolder);
            if (targetFolder && targetFolder.parentFolder && targetFolder.parentFolder.toString() === id) {
                return res.status(400).json({ message: 'Cannot move folder into its own child' });
            }
        }

        folder.parentFolder = parentFolder || null;
        await folder.save();

        res.json(folder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createFolder,
    getFolderContents,
    deleteFolder,
    getTrashFolders,
    restoreFolder,
    permanentDeleteFolder,
    moveFolder
};
