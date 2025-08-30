const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const nodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Node name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Node type is required'],
    enum: {
      values: ['Bharat', 'Kshetra', 'Prant', 'Vibhag', 'Jila', 'Nagar', 'Khand', 'Branch'],
      message: 'Invalid node type'
    }
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    default: null,
    validate: {
      validator: function(value) {
        // Bharat should not have parent
        if (this.type === 'Bharat' && value !== null) {
          return false;
        }
        // Other types should have parent (except when creating Bharat)
        if (this.type !== 'Bharat' && value === null) {
          return false;
        }
        return true;
      },
      message: 'Parent validation failed'
    }
  },
  nodeCode: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  plainPassword: {
    type: String,
    required: true,
    minlength: 6,
    select: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
nodeSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
nodeSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to generate node code
nodeSchema.statics.generateNodeCode = function(name) {
  const sanitizedName = name.replace(/\s+/g, '').toUpperCase(); // Remove spaces
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${sanitizedName}-${randomString}`;
};

// Static method to generate random password (max 10 chars)
nodeSchema.statics.generatePassword = function() {
  return Math.random().toString(36).substring(2, 12); // gives 10 chars max
};


// Index for faster queries
nodeSchema.index({ parentId: 1 });
nodeSchema.index({ type: 1 });
nodeSchema.index({ nodeCode: 1 });

module.exports = mongoose.model('Node', nodeSchema);