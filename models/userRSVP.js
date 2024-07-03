const mongoose = require("mongoose");
const { Schema } = mongoose;

const userRSVPSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        postId: {
            type: Schema.Types.ObjectId,
            ref: "PostFeed",
        },
    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("RSVP", userRSVPSchema);
