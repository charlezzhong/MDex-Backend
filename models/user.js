const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "Subscriber",
    },
    image: {
      type: String,
    },
    resetCode: {
      type: String,
    },
    verificationCode: {
      type: String,
    },
    allow_notifications: {
      type: Boolean,
      default: true,
    },
    notifications: [
      {
        type: String
      }
    ],
    token: {
      type: String,
    },
    // depends on the functionality how user manage their card info
    stripeCustomerId: { 
      type: String,
      required: false
    }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
