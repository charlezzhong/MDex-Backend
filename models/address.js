const mongoose = require('mongoose');
const {Schema} = mongoose;

const institutionSchema = new Schema(
  {
    unitNumber:  {
        type: Number,
        default: '',
    },
    addressLine1: {
        type: String,
    },
    addressLine2: {
        type: String,
        default: '',
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    postalCode: {
        type: String,
    },
    country: {
        type: String,
    },
    mapbox_id: {
        type: String,
        required: true,
    },
  },
  {timestamps: true},
);

module.exports = mongoose.model('Address', institutionSchema);
