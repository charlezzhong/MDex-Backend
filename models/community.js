const mongoose = require("mongoose");
const { Schema } = mongoose;

const communitySchema = new Schema(
    {
        community : [{
            type: String
        }]
    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("Community", communitySchema);
