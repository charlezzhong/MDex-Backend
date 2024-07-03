const { response } = require("../helpers/responseHandle");
const userForRsvp = require("../models/userForRsvp");


  
exports.getRsvpUsers = async (req, res) => {
    try {
      const { rsvpId } = req.params;
  
      const rsvps = await userForRsvp.find({ rsvpId: rsvpId }).populate('userId')
      res.json(rsvps);
    } catch (err) {
      console.log(err);
  
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  };

exports.addRsvpUser = async (req, res) => {
    try {
      const body = req.body;
        if(!body.userId && !body.rsvpId && !body.answers){
            return response(400,'Bad input',null,res)
        }
      const rsvps = await userForRsvp.create(body)
      return response(200,"added to rsvps", rsvps, res)
    } catch (err) {
      console.log(err);
  
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  };
  