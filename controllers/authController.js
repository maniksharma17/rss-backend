const jwt = require('jsonwebtoken');
const Node = require('../models/Node');

/**
 * Login controller
 */
const login = async (req, res) => {
  try {
    const { nodeCode, password } = req.body;

    // Validation
    if (!nodeCode || !password) {
      return res.status(400).json({
        success: false,
        message: 'Node code and password are required'
      });
    }

    // Find node by nodeCode
    const node = await Node.findOne({ nodeCode });
    
    if (!node) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await node.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const payload = {
      nodeId: node._id,
      type: node.type,
      name: node.name
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        nodeId: node._id,
        type: node.type,
        name: node.name,
        nodeCode: node.nodeCode
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

/**
 * Get current user info
 */
const getMe = async (req, res) => {
  try {
    const node = await Node.findById(req.user.nodeId)
      .select('-password')
      .populate('parentId', 'name type');

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'Node not found'
      });
    }

    res.status(200).json({
      success: true,
      data: node
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  getMe
};