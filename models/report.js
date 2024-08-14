const mongoose = require("mongoose");
const { statusValue } = require("../helpers/enums");
const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    postInfo:{
        type: Schema.Types.ObjectId,
        ref: 'PostFeed',
        required: false
    },
    lat: {
        Number,
        required: true
    },
    lng: {
        Number,
        required: true
    },
    eventtype: {
        String,
        required: true
    },
    eventSubtype:{
        String,
        required: false
    },
    privacy: {
        String,
        required: true
    }
  }
);

module.exports = mongoose.model("Report", reportSchema);


