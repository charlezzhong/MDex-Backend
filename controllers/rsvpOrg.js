const { response } = require("../helpers/responseHandle")
const rsvp = require("../models/rsvp")

exports.UpdateRsvp = async (req, res) => {
    let body = req.body
    let {rsvpId} = req.params

    try {
        let resp = await rsvp.findByIdAndUpdate(rsvpId, body,{new:true})
        return response(200, 'successfully updated', resp, res)
    } catch (error) {
        return response(500, error?.message || "Something went wrong", error,res)
    }
}