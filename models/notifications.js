const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        title : {
            type: String,
        },
        body : {
            type: String,
        },
        message: {
            type: String,
        }
    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("Notifications", notificationSchema);
