const mongoose = require("mongoose");
const { Schema } = mongoose;

const settingSchema = new Schema(
    {
        identifier: {
            type: Number,
            default: 1
        },
        lastFetchedPosts: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("settings", settingSchema);
