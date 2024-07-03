const dayjs = require("dayjs");
const UserPosts = require("../models/userPosts");
const PostFeed = require("../models/postFeed");
const { scheduleCustomJob } = require("../helpers/scheduler");
const { default: mongoose } = require("mongoose");


exports.savePost = async (req, res) => {
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

        //check if post already exists
        const postExists = await UserPosts.findOne({ postId: postId, userId: userId });
        if(postExists){
            return res.json({
                error: "Post already exists",
            })
        }

        const userPost = new UserPosts(req.body);
        await userPost.save();

        await scheduleCustomJob(post.eventDate, post.eventTime, userId, postId)

        return res.json({
            data: userPost,
        })

    } catch (err) {
        return res.status(500).json({ 
            error: err.message || "Internal Server Error"
        });
    }
}

exports.getPosts = async ( req, res) => {
    try {
        const { userId } = req.query;
        console.log('userId', userId)
        if(!userId){
            return res.json({
                error: "userId is required"
            })
        }
        let startDate = dayjs().tz("America/Toronto").startOf('day');
        let today = dayjs().tz('America/Toronto');
        console.log('startDate', today.toDate())
        const userPosts = await UserPosts.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'postfeeds',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'postId'
                }
            },
            {
                $unwind: '$postId'
            },
            {
                $addFields: {
                  "postId.eventDate": {
                    $dateFromString: {
                      dateString: "$postId.eventDate",
                      format: "%m/%d/%Y",
                      timezone: "America/Toronto",
                    },
                  },
                }
            },
            {
                $match: {
                  postId: { $ne: null },
                  "postId.verified": true,
                  "postId.eventDate": {
                    $gte: startDate.toDate(),
                  }
                }
            },
            {
                // convert back event date
                $addFields: {
                  "postId.eventDate": {
                    $dateToString: {
                      date: "$postId.eventDate",
                      format: "%m/%d/%Y",
                      timezone: "America/Toronto",
                    },
                  },
                }
            },
            {
                // add string event end time for spliting (date cannot be split)
                $addFields: {
                  stringEventEndTime: {
                    $dateToString: {
                      date: "$postId.eventEndTime",
                      timezone: "America/Toronto",
                    },
                  },
                },
            },
            {
                // adding field newEndTime from (eventDate + eventEndTime)
                $addFields: {
                  newEndTime: {
                    $concat: [
                      {
                        $arrayElemAt: [
                          {
                            $split: ["$postId.eventDate", "/"],
                          },
                          2,
                        ],
                      },
                      "-",
                      {
                        $arrayElemAt: [
                          {
                            $split: ["$postId.eventDate", "/"],
                          },
                          0,
                        ],
                      },
                      "-",
                      {
                        $arrayElemAt: [
                          {
                            $split: ["$postId.eventDate", "/"],
                          },
                          1,
                        ],
                      },
                      "T",
                      {
                        $arrayElemAt: [
                          {
                            $split: ["$stringEventEndTime", "T"],
                          },
                          1,
                        ],
                      },
                    ],
                  },
                },
              },
              {
                // convert newEndTime to date
                $addFields: {
                  newEndTime: {
                    $dateFromString: {
                      dateString: "$newEndTime",
                      format: "%Y-%m-%dT%H:%M:%S.%LZ",
                      timezone: "America/Toronto",
                    },
                  },
                },
              },
              {
                $match: {
                  $or: [
                    {
                      "postId.eventEndTime": {
                        $eq: null,
                      },
                    },
                    {
                      newEndTime: {
                        $gte: today.toDate(),
                      },
                    },
                  ],
                },
            },
        ])
        return res.json({
            data: userPosts
        })

    } catch (err) {
        return res.status(500).json({ 
            error: err.message || "Internal Server Error"
        });   
    }
}

exports.deletePost = async (req, res) => {

    try{
        const { id } = req.body;
        if(!id){
            return res.json({
                error: "User Post id is required"
            })
        }

        const userPost = await UserPosts.findByIdAndDelete(id);

        return res.json({
            data: true,
        })

    }catch(err) {
        return res.status(500).json({ 
            error: err.message || "Internal Server Error"
        });
    }

}
