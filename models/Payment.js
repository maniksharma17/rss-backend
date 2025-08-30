const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: [true, 'Member ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  modeOfPayment: {
    type: String,
    enum: {
      values: ['cash', 'upi', 'cheque'],
      message: 'Invalid payment mode'
    },
    default: 'cash'
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSchema.index({ memberId: 1 });
paymentSchema.index({ date: -1 });
paymentSchema.index({ amount: 1 });

module.exports = mongoose.model('Payment', paymentSchema);