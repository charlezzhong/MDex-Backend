const mongoose = require('mongoose');
const {Schema} = mongoose;

const postFeedSchema = new Schema(
  {
    organizationName: {
      type: String,
      
    },
    orgRefId:  {
      type: String,
      default: '',
    },
    rsvp:  {
        type: Schema.Types.ObjectId,
        ref: 'Rsvp',
        required:false
    },
    eligible:  {
        type: Boolean,
        default: false,
    },
    community:  {
        type: Schema.Types.ObjectId,
        ref: 'Community',
        required:false
    },
    organization:  {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    body: {
      type: String,
      trim: true,
    },
    link: {
      type: String
    },
    description: {
      type: String,
    },
    website: {
      type: String,
    },
    instagram: {
      type: String,
      default: '',
    },
    eventDate: {
      type: String,
    },
    eventTime: {
      type: String,
    },
    eventEndTime: {
      type: Date,
    },
    eventLocation: {
      type: String,
    },
    eventLocationDescription: {
      type: String,
      default: '',
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
    category: {
      type: String,
    },
    campus: {
      type: String,
      enum : ['north', 'central', 'all'],
      default: 'all'
    },
  },
  {timestamps: true},
);

module.exports = mongoose.model('PostFeed', postFeedSchema);
