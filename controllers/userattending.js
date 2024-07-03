const dayjs = require("dayjs");
const UserRSVP = require("../models/userRSVP");
const PostFeed = require("../models/postFeed");
const { scheduleCustomJob } = require("../helpers/scheduler");
const { default: mongoose } = require("mongoose");


exports.rsvpPost = async (req, res) => {
    try {
        const { postId, userId } = req.body;

        if(!postId || !userId){
            return res.json({
                error: "PostId and userId are required"
            })
        }
        const post = await PostFeed.findById(postId);
        if(!post){
            return res.json({
                error: "Post not found"
            })
        }

        // Check if the user already has an RSVP record for this post
        let rsvp = await UserRSVP.findOne({ postId, userId });

        if (rsvp) {
            // If an RSVP record exists, update the status
            rsvp.status = status;
            await rsvp.save();
        } else {
            // If no RSVP record exists, create a new one
            rsvp = new UserRSVP({ postId, userId, status });
            await rsvp.save();
        }


        return res.json({
            message: "RSVP successfully recorded",
            data: rsvp,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            error: err.message || "Internal Server Error"
        });
    }
}

exports.getRsvp = async ( req, res) => {
    try {
        const { userId, postId } = req.query;
        console.log('userId', userId, 'postID', postId)
        if(!userId || !postId){
            return res.json({
                error: "userId and postID are required"
            })
        }
        let startDate = dayjs().tz("America/Toronto").startOf('day');
        
        const userRSVPs = await UserRSVP.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    postId: new mongoose.Types.ObjectId(postId)
                }
            },
            {
                $lookup: {
                    from: 'postfeeds',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            {
                $unwind: '$post'
            },
            {
                $addFields: {
                  "post.eventDate": {
                    $dateFromString: {
                      dateString: "$post.eventDate",
                      format: "%m/%d/%Y",
                      timezone: "America/Toronto",
                    },
                  },
                }
            },
            {
                $match: {
                  post: { $ne: null },
                  "post.verified": true,
                  "post.eventDate": {
                    $gte: startDate.toDate(),
                  }
                }
            },
            {
                // convert back event date
                $addFields: {
                  "post.eventDate": {
                    $dateToString: {
                      date: "$post.eventDate",
                      format: "%m/%d/%Y",
                      timezone: "America/Toronto",
                    },
                  },
                }
            }
        ])
        return res.json({
            data: userRSVPs
        })

    } catch (err) {
        return res.status(500).json({ 
            error: err.message || "Internal Server Error"
        });   
    }
}

exports.deleteRsvp = async (req, res) => {

    try{
        const { userId, postId } = req.body;
        if(!userId || !postId){
            return res.json({
                error: "UserId and PostId required"
            })
        }

        const userRSVPs = await UserRSVP.findOneAndDelete({ userId: userId, postId: postId });

        // Check if the RSVP was actually found and deleted
        if (!userRSVP) {
            return res.status(404).json({
                error: "RSVP not found"
            });
        }

        return res.json({
            message: "RSVP successfully deleted",
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            error: err.message || "Internal Server Error"
        });
    }

}
