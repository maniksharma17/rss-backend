const mongoose = require('mongoose');

// -------------------------
// Counter schema (for sequence)
// -------------------------
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// -------------------------
// Member schema
// -------------------------
const memberSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: [true, 'Branch ID is required'],
    validate: {
      validator: async function (value) {
        const Node = mongoose.model('Node');
        const branch = await Node.findById(value);
        return branch && branch.type === 'Gram/Shakha/Mohalla/Sthaan';
      },
      message: 'Member must belong to a Branch node'
    }
  },
  rssId: {
    type: String,
    unique: true,
    index: true
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
      validator: function (email) {
        if (!email) return true; // Optional
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function (phone) {
        if (!phone) return true; // Optional
        return /^\+?[\d\s\-\(\)]+$/.test(phone);
      },
      message: 'Please enter a valid phone number'
    }
  },
  address: { type: String, trim: true },
  age: {
    type: Number,
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age must be less than 120']
  },
  birthYear: { type: String },
  sanghYears: { type: Number },
  role: { type: String },
  training: {
    type: String,
    enum: ['प्रारंभिक', 'प्राथमिक', 'संघ शिक्षा वर्ग-१', 'संघ शिक्षा वर्ग-२', '']
  },
  uniform: Boolean,
  occupation: { type: String, trim: true },
  educationLevel: {
    type: String,
    trim: true,
  },
  college: {
    type: String,
    trim: true,
  }
}, { timestamps: true });


// Auto-generate customId (sequential, padded to 8 digits)
memberSchema.pre('save', async function (next) {
  if (!this.rssId) {
    const counter = await Counter.findOneAndUpdate(
      { name: 'rssId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.rssId = `RSS-${counter.seq.toString().padStart(8, '0')}`;
  }
  next();
});

// -------------------------
// Indexes for performance
// -------------------------
memberSchema.index({ branchId: 1 });
memberSchema.index({ name: 1 });
memberSchema.index({ email: 1 });

module.exports = mongoose.model('Member', memberSchema);
