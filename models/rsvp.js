const mongoose = require("mongoose");
const { rsvpStatus } = require("../helpers/enums");
const { Schema } = mongoose;

const rsvpSchema = new Schema(
    {
        post :{
            type: Schema.Types.ObjectId,
            ref: 'PostFeed',
            
        },
        orgRefId:{
            type: String,
            required:false
        },
        totalCount:{
            type:Number,
            default:0
        },
        rsvpLimit:{
            type:Number,
            default:999
        },
        rsvpStatus:{
            type:String,
            enum: Object.keys(rsvpStatus),
            default:rsvpStatus.waitlist
        },
        // users : {
        //     name: {
        //         type: String,
        //         required:true
        //     },
        //     email: {
        //         type: String,
        //         required:true
        //     }
        //  }
        // ,
        waitlist:{
            type: Boolean,
            default:true
        },
        optionals: {
            optional1:{
                type:String,
                required:false
            },
            optional2:{
                type:String,
                required:false
            },
            optional3:{
                type:String,
                required:false
            },
        }

    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("Rsvp", rsvpSchema);
