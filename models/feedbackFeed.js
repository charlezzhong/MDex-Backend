const mongoose = require('mongoose');
const {Schema} = mongoose;

const feedbackFeedSchema = new Schema(
  {
    feedback: {
      type: String,
      trim: true,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      // required: true,
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {timestamps: true},
);

module.exports = mongoose.model('feedbackFeed', feedbackFeedSchema);
