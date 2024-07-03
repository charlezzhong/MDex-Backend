const mongoose = require("mongoose");
const { Schema } = mongoose;

const officeSchema = new Schema(
    {
        officeBuilding : {
            type: String,
        },
        roomNumber : {
            type: Number,
        },
        hours : {
            sunday: {
                start: {
                    type: String
                },
                end:{
                    type: String
                },
                isClosed: {
                    type: Boolean,
                    default:false
                }
            },
            monday: {
                start: {
                    type: String
                },
                end:{
                    type: String
                },
                isClosed: {
                    type: Boolean,
                    default:false
                }
            },
            tuesday: {
                start: {
                    type: String
                },
                end:{
                    type: String
                },
                isClosed: {
                    type: Boolean,
                    default:false
                }
            },
            wednesday: {
                start: {
                    type: String
                },
                end:{
                    type: String
                },
                isClosed: {
                    type: Boolean,
                    default:false
                }
            },
            thursday: {
                start: {
                    type: String
                },
                end:{
                    type: String
                },
                isClosed: {
                    type: Boolean,
                    default:false
                }
            },
            friday: {
                start: {
                    type: String
                },
                end:{
                    type: String
                },
                isClosed: {
                    type: Boolean,
                    default:false
                }
            },
            saturday: {
                start: {
                    type: String
                },
                end:{
                    type: String
                },
                isClosed: {
                    type: Boolean,
                    default:false
                }
            },
        },
    },
    {
        timestamps: true 
    }
)

module.exports = mongoose.model("Office", officeSchema);
