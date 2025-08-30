const express = require('express');
const {
  createNode,
  getNode,
  getNodeChildren,
  getNodeByCode,
  editNode,
  deleteNode
} = require('../controllers/nodeController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/nodes
// @desc    Create a new child node
// @access  Private
router.post('/', auth, createNode);

// @route   POST /api/nodes
// @desc    Edit a child node
// @access  Private
router.put('/:nodeId', auth, editNode);

// @route   POST /api/nodes
// @desc    Delete a child node
// @access  Private
router.delete('/:nodeId', auth, deleteNode);

// @route   GET /api/nodes/:id
// @desc    Get node details
// @access  Private
router.get('/:id', auth, getNode);

// @route   GET /api/nodes/:code
// @desc    Get node details by node code
// @access  Private
router.get('/code/:code', auth, getNodeByCode);

// @route   GET /api/nodes/:id/children
// @desc    Get children of a node
// @access  Private
router.get('/:id/children', auth, getNodeChildren);

module.exports = router;