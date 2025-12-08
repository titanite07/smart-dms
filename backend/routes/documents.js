const express = require('express');
const {
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
    getStorageUsage,
    getDuplicates,
    bulkDelete,
    bulkMove,
    getAnalytics
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadDocument);
router.post('/:id/version', protect, upload.single('file'), uploadVersion);
router.get('/', protect, getDocuments);
router.get('/search', protect, searchDocuments);
router.get('/trash', protect, getTrash);
router.get('/storage', protect, getStorageUsage);
router.get('/public/:token', accessPublicLink);
router.post('/:id/share', protect, shareDocument);
router.post('/:id/public-link', protect, createPublicLink);
router.delete('/:id/public-link', protect, revokePublicLink);
router.get('/:id/versions', protect, getVersions);
router.get('/:id/download', downloadFile);
router.put('/:id/star', protect, toggleStar);
router.put('/:id/move', protect, moveDocument);
router.put('/:id/restore', protect, restoreDocument);
router.delete('/:id', protect, deleteDocument);
router.delete('/:id/versions/:versionId', protect, deleteVersion);
router.delete('/:id/permanent', protect, permanentDelete);
router.get('/duplicates', protect, getDuplicates);
router.post('/bulk-delete', protect, bulkDelete);
router.post('/bulk-move', protect, bulkMove);
router.get('/analytics', protect, getAnalytics);

module.exports = router;
