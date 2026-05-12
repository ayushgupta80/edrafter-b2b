const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // Reference to the user initiating the transaction
    type: {
      type: String,
      enum: ['Debit', 'Credit'], // Specifies whether it's a debit or credit
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'], // Ensure positive values
    },
    balanceBefore: {
      type: Number,
      required: true,
    }, // User's balance before the transaction
    balanceAfter: {
      type: Number,
      required: true,
    }, // User's balance after the transaction
    description: {
      type: String,
      required: true,
    }, // Description or purpose of the transaction
    createdAt: {
      type: Date,
      default: Date.now,
    }, // Timestamp of when the transaction occurred
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
