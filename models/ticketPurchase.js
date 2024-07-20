const mongoose = require('mongoose');

const ticketPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'PostFeed', required: true },
  purchaseDate: { type: Date, default: Date.now },
  //qr_id: 

//////

  ticketInfo: {
    price: Number,
    currency: String,
    stripeTransactionId: String,
    _id: false,
  },
}, { timestamps: true });

const TicketPurchase = mongoose.model('TicketPurchase', ticketPurchaseSchema);
module.exports = TicketPurchase;