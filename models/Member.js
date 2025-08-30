const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: [true, 'Branch ID is required'],
    validate: {
      validator: async function(value) {
        const Node = mongoose.model('Node');
        const branch = await Node.findById(value);
        return branch && branch.type === 'Branch';
      },
      message: 'Member must belong to a Branch node'
    }
  },
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        if (!email) return true; // Optional field
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        if (!phone) return true; // Optional field
        return /^\+?[\d\s\-\(\)]+$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  address: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age must be less than 120']
  },
  occupation: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
memberSchema.index({ branchId: 1 });
memberSchema.index({ name: 1 });
memberSchema.index({ email: 1 });

// Virtual for total paid amount
memberSchema.virtual('totalPaid', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'memberId',
  justOne: false
});

module.exports = mongoose.model('Member', memberSchema);