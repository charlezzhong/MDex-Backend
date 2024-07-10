const mongoose = require('mongoose');

const ticketPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  purchaseDate: { type: Date, default: Date.now },
  ticketInfo: {
    price: Number,
    currency: String,
    stripeTransactionId: String,
    _id: false,
  },
}, { timestamps: true });

const TicketPurchase = mongoose.model('PostFeed', ticketPurchaseSchema);
module.exports = TicketPurchase;