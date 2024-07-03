const mongoose = require("mongoose");
const { Schema } = mongoose;

const institutionSchema = new Schema(
    {
        institutionName:{
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: Schema.Types.ObjectId,
            ref: 'Address',
        },
    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("Institution", institutionSchema);
