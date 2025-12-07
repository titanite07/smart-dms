const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createFolder, getFolderContents, deleteFolder, getTrashFolders, restoreFolder, permanentDeleteFolder, moveFolder } = require('../controllers/folderController');

router.post('/', protect, createFolder);
router.get('/trash', protect, getTrashFolders);
router.get('/:folderId', protect, getFolderContents);
router.put('/:id/move', protect, moveFolder);
router.put('/:id/restore', protect, restoreFolder);
router.delete('/:id/permanent', protect, permanentDeleteFolder);
router.delete('/:id', protect, deleteFolder);

module.exports = router;
