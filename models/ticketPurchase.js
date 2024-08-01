const mongoose = require('mongoose');
const { Schema } = mongoose;

const ticketPurchaseSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    stripeSessionId: { 
      type: String, 
      required: true 
    },
    stripePaymentIntentId: { 
      type: String, 
      required: true 
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    quantity: {
      type: Number,
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('TicketPurchase', ticketPurchaseSchema);
