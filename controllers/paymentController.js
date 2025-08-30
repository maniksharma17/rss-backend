const Payment = require('../models/Payment');
const Member = require('../models/Member');

/**
 * Create a new payment
 */
const createPayment = async (req, res) => {
  try {
    const { memberId, amount, modeOfPayment, date, description } = req.body;

    // Validation
    if (!memberId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Member ID and amount are required'
      });
    }

    // Check if member exists and belongs to user's branch
    const member = await Member.findById(memberId).populate('branchId');
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check if user has access to this member (must be from the same branch)
    if (req.user.type === 'Branch' && member.branchId._id.toString() !== req.user.nodeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Member does not belong to your branch'
      });
    }

    // Create new payment
    const newPayment = new Payment({
      memberId,
      amount,
      modeOfPayment: modeOfPayment || 'cash',
      date: date ? new Date(date) : new Date(),
      description
    });

    await newPayment.save();

    // Populate member details for response
    await newPayment.populate('memberId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: newPayment
    });

  } catch (error) {
    console.error('Create payment error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while recording payment'
    });
  }
};

/**
 * Get all payments for a member
 */
const getMemberPayments = async (req, res) => {
  try {
    const memberId = req.params.memberId;

    // Check if member exists
    const member = await Member.findById(memberId).populate('branchId');
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check access rights
    if (req.user.type === 'Branch' && member.branchId._id.toString() !== req.user.nodeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const payments = await Payment.find({ memberId })
      .sort({ date: -1 })
      .populate('memberId', 'name email');

    // Calculate total
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        payments,
        total,
        member: {
          id: member._id,
          name: member.name,
          email: member.email,
          phone: member.phone
        }
      }
    });

  } catch (error) {
    console.error('Get member payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get all payments for current user's branch
 */
const getMyBranchPayments = async (req, res) => {
  try {
    // Check if user is from a Branch
    if (req.user.type !== 'Branch') {
      return res.status(403).json({
        success: false,
        message: 'Only Branch nodes can access payments'
      });
    }

    // Get all members of this branch
    const members = await Member.find({ branchId: req.user.nodeId });
    const memberIds = members.map(member => member._id);

    // Get all payments for these members
    const payments = await Payment.find({ memberId: { $in: memberIds } })
      .sort({ date: -1 })
      .populate('memberId', 'name email phone');

    // Calculate total
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        payments,
        total,
        branchName: req.user.name
      }
    });

  } catch (error) {
    console.error('Get my branch payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get payment by ID
 */
const getPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findById(paymentId)
      .populate('memberId', 'name email phone branchId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createPayment,
  getMemberPayments,
  getMyBranchPayments,
  getPayment
};