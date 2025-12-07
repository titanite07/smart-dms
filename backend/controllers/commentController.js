const Comment = require('../models/Comment');
const Document = require('../models/Document');
const { logActivity } = require('./activityController');

const getComments = async (req, res) => {
    try {
        const { documentId } = req.params;

        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const hasAccess = document.owner.toString() === req.user._id.toString() ||
            document.sharedWith.some(share => share.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'No access to this document' });
        }

        const comments = await Comment.find({ document: documentId, isDeleted: false })
            .populate('user', 'name email')
            .populate('parentComment')
            .populate('mentions', 'name email')
            .sort({ createdAt: -1 });

        const rootComments = comments.filter(c => !c.parentComment);
        const replies = comments.filter(c => c.parentComment);

        const commentsWithReplies = rootComments.map(comment => {
            const commentObj = comment.toObject();
            commentObj.replies = replies.filter(r =>
                r.parentComment && r.parentComment._id.toString() === comment._id.toString()
            );
            return commentObj;
        });

        res.json(commentsWithReplies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { content, parentCommentId, mentions } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const hasAccess = document.owner.toString() === req.user._id.toString() ||
            document.sharedWith.some(share => share.user.toString() === req.user._id.toString());

        if (!hasAccess) {
            return res.status(403).json({ message: 'No access to this document' });
        }

        const comment = await Comment.create({
            document: documentId,
            user: req.user._id,
            content: content.trim(),
            parentComment: parentCommentId || null,
            mentions: mentions || []
        });

        await comment.populate('user', 'name email');
        await comment.populate('mentions', 'name email');

        await logActivity(req.user._id, 'comment_add', 'document', documentId, document.title,
            { commentId: comment._id }, req);

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own comments' });
        }

        comment.content = content.trim();
        comment.isEdited = true;
        comment.editedAt = new Date();
        await comment.save();

        await comment.populate('user', 'name email');

        res.json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId).populate('document');
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const isOwner = comment.user.toString() === req.user._id.toString();
        const isDocOwner = comment.document.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

        if (!isOwner && !isDocOwner && !isAdmin) {
            return res.status(403).json({ message: 'No permission to delete this comment' });
        }

        comment.isDeleted = true;
        await comment.save();

        await logActivity(req.user._id, 'comment_delete', 'document', comment.document._id,
            comment.document.title, { commentId }, req);

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCommentCount = async (req, res) => {
    try {
        const { documentId } = req.params;
        const count = await Comment.countDocuments({ document: documentId, isDeleted: false });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getComments,
    addComment,
    updateComment,
    deleteComment,
    getCommentCount
};
