const mongoose = require("mongoose");
const { statusValue } = require("../helpers/enums");
const { Schema } = mongoose;

const orgSchema = new Schema(
  {
    orgRefId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      default: statusValue.pending,
    },
    orgName: {
      type: String,
      default: false,
    },
    orgLogo: {
      type: String,
    },
    orgEmail: { //this is the email used to login
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    email: { //this is the updatable email
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    orgPhone: {
      type: String,
    },
    orgBio: {
      type: String,
      default:''
    },
    orgInsta: {
      type: String,
      default:''
    },
    orgWebsite: {
      type: String,
    },
    institution: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required:false
    },
    orgAddress: {
      type: Schema.Types.ObjectId,
      ref: 'Address', 
      required:false
    },
    office: {
      type: Schema.Types.ObjectId,
      ref: 'Office', 
      required:false
    },
    openHours: {
      to: {
        type: Date,
      },
      from: {
        type: Date,
      }
    },
    totalPost: {
      type: Number,
      default: 0,
    },
    totalFollower: {
      type: Number,
      default: 0,
    },
    goal:{
      type: Number,
      default: 0
    },
    media: [
      {
        type:String,
        required:false
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", orgSchema);
