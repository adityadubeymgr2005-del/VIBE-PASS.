const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET, authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get User model dynamically
const getUserModel = () => db.User();

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const User = getUserModel();
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'user'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const User = getUserModel();
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const User = getUserModel();
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// GET all users (Admin only)
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const User = getUserModel();
    const users = await User.find({});
    // Remove passwords for safety
    const safeUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.status(200).json(safeUsers);
  } catch (error) {
    console.error('Fetch users admin error:', error);
    res.status(500).json({ message: 'Server error fetching user profiles list' });
  }
});

// PUT update user role (Admin only)
router.put('/users/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role assignment' });
    }

    const User = getUserModel();
    // Cannot demote oneself
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Self-role alteration is not allowed' });
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Update user role admin error:', error);
    res.status(500).json({ message: 'Server error updating user role' });
  }
});

// DELETE user (Admin only)
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const User = getUserModel();
    
    // Cannot delete oneself
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Self-deletion is not permitted' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User account removed successfully' });
  } catch (error) {
    console.error('Delete user admin error:', error);
    res.status(500).json({ message: 'Server error terminating user account' });
  }
});

module.exports = router;

