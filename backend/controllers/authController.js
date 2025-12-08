const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
            });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        const user = await User.create({ name, email, password });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const clerkClient = require('@clerk/clerk-sdk-node');
const checkAvailability = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const userExists = await User.findOne({ email });
        res.json({ isAvailable: !userExists });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const syncUser = async (req, res) => {
    try {
        if (!req.auth || !req.auth.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { userId } = req.auth;
        let user = await User.findOne({ clerkId: userId });
        if (!user) {
            const { name, email } = req.body;
            if (!email) {
                return res.status(400).json({ message: 'Email required for initial sync' });
            }
            user = await User.findOne({ email });
            if (user) {
                user.clerkId = userId;
                await user.save();
            } else {
                user = await User.create({
                    name: name || 'User',
                    email: email,
                    password: 'clerk_authenticated',
                    clerkId: userId
                });
            }
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error("Sync Error", error);
        res.status(500).json({ message: error.message });
    }
};
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const updateProfile = async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(409).json({ message: 'Email already in use' });
            }
            user.email = email;
        }
        if (name) {
            user.name = name;
        }
        if (currentPassword && newPassword) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
                });
            }
            user.password = newPassword;
        }
        await user.save();
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.password && !user.clerkId) {
            if (!password) {
                return res.status(400).json({ message: 'Password required to delete account' });
            }
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect password' });
            }
        }
        const Document = require('../models/Document');
        const Folder = require('../models/Folder');
        const fs = require('fs');
        const path = require('path');
        const userDocuments = await Document.find({ user: user._id });
        for (const doc of userDocuments) {
            const filePath = path.join(__dirname, '..', 'uploads', doc.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await Document.deleteMany({ user: user._id });
        await Folder.deleteMany({ user: user._id });
        await User.findByIdAndDelete(user._id);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
module.exports = { signup, login, checkAvailability, syncUser, getProfile, updateProfile, deleteAccount };
