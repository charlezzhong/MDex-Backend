const mongoose = require("mongoose");
/* The line `const { statusValue } = require("../helpers/enums");` is importing the `statusValue`
constant from the `enums.js` file located in the `helpers` directory. This constant is likely used
to provide predefined values for the `status` field in the `restSchema`. By importing it, the code
can use the predefined values for the `status` field in the schema definition. */
const { statusValue } = require("../helpers/enums");
const { Schema } = mongoose;

const restSchema = new Schema(
  {
    restRefId: {
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
      required: false,
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
      required: false,
      unique: true,
    },
    orgPhone: {
      type: String,
    },
    orgBio: {
      type: String,
      default:'',
      required: false
    },
    orgInsta: {
      type: String,
      default:'',
      required: false
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
      type: String, 
      required:false
    },
    lat: {
      type: String, 
      //required: true
  },
    lng: {
      type: String, 
        //required: true
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
    stripeAccountId: {
      type: String,
      required: false
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

module.exports = mongoose.model("Restaurant", restSchema);