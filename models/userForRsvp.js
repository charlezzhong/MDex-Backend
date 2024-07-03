const { default: mongoose } = require("mongoose");
const { Schema } = require("mongoose");

const userForRsvp = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        rsvpId: {
            type: Schema.Types.ObjectId,
            ref: "Rsvp",
        },
        answers:{
            type: Map,
            of: String
        }
    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("usersForRsvp", userForRsvp);
