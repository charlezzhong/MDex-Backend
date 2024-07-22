const mongoose = require('mongoose');
const { Schema } = mongoose;

const ticketSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: 'PostFeed',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    stripeProductId: {
      type: String,
    },
    stripePriceId: {
      type: String,
    },
    availableQuantity: {
      type: Number,
      default: 0,
    },
    soldQuantity: {
      type: Number,
      default: 0,
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Ticket', ticketSchema);