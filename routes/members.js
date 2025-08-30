const express = require('express');
const {
  createMember,
  getBranchMembers,
  getMyMembers,
  getMember,
  editMember,
  deleteMember
} = require('../controllers/memberController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/members
// @desc    Create a new member (Branch only)
// @access  Private
router.post('/', auth, createMember);

// @route   POST /api/members
// @desc    Edit a member 
// @access  Private
router.put('/:id', auth, editMember);

// @route   POST /api/members
// @desc    Delete a member 
// @access  Private
router.delete('/:id', auth, deleteMember);

// @route   GET /api/members/my-members
// @desc    Get current branch's members
// @access  Private
router.get('/my-members', auth, getMyMembers);

// @route   GET /api/members/:branchId
// @desc    Get members of a specific branch
// @access  Private
router.get('/:branchId', auth, getBranchMembers);

// @route   GET /api/members/detail/:id
// @desc    Get member details
// @access  Private
router.get('/detail/:id', auth, getMember);

module.exports = router;