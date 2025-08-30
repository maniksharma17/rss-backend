const jwt = require('jsonwebtoken');
const Node = require('../models/Node');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the node to ensure it still exists
    const node = await Node.findById(decoded.nodeId);
    if (!node) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid. Node not found.'
      });
    }

    req.user = {
      nodeId: decoded.nodeId,
      type: decoded.type,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

module.exports = auth;