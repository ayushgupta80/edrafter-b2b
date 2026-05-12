const mongoose = require('mongoose');

const topupSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, 
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'], 
    },
    status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },

    paymentNote: { type: String, required: true, default: " " },
    refNo: { type: String, required: true, default: " " },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Topup = mongoose.model('Topup', topupSchema);

module.exports = Topup;
