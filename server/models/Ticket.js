const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },  // Detailed description of the issue
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },  // Current status of the ticket
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Low' },  // Priority level of the ticket
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  replies: [
    {
      message: { type: String, required: true },  // Message content of the reply
      repliedBy: { type: String, required: true },  // Identifier for who replied (could be user ID or name)
      createdAt: { type: Date, default: Date.now }  // Timestamp for each reply
    }
  ]
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
