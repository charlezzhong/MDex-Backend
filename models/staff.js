const mongoose = require("mongoose");
const { Schema } = mongoose;

const StaffSchema = new Schema(
    {
        organization:  [{
            type: Schema.Types.ObjectId,
            ref: 'Organization',
        }],
        address: {
            type: Schema.Types.ObjectId,
            ref: 'Address',
        },
        office:{
            type: Schema.Types.ObjectId,
            ref: 'Office',
        },
        name:{
            type: String,
            required: true,
            trim: true,
        },
        jobTitle:{
            type: String,
            required: true,
        },
        email:{
            type: String,
            trim: true,
            required: true,
            unique: true,
        },
        profilePic: {
            type: String,
        },
        role:{
            type: String,
            required: true,
            trim: true,
        },
        bio:{
            type: String,
            default: '',
        },
    },
    {
        timestamps: true 
    }
)

module.exports  = mongoose.model("Staff", StaffSchema);
