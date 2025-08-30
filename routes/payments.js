const express = require('express');
const {
  createPayment,
  getMemberPayments,
  getMyBranchPayments,
  getPayment
} = require('../controllers/paymentController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments
// @desc    Create a new payment
// @access  Private
router.post('/', auth, createPayment);

// @route   GET /api/payments/my-branch
// @desc    Get all payments for current user's branch
// @access  Private
router.get('/my-branch', auth, getMyBranchPayments);

// @route   GET /api/payments/:memberId
// @desc    Get all payments for a member
// @access  Private
router.get('/:memberId', auth, getMemberPayments);

// @route   GET /api/payments/detail/:id
// @desc    Get payment details
// @access  Private
router.get('/detail/:id', auth, getPayment);

module.exports = router;