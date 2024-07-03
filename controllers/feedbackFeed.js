const FeedbackFeed = require('../models/feedbackFeed');
const fs = require('fs');
const path = require('path');
const {moveFiles} = require('../helpers/fileMove');
const dayjs = require('dayjs');

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone');
const feedbackFeed = require('../models/feedbackFeed');

dayjs.extend(utc)
dayjs.extend(timezone)

exports.createFeedback = async (req, res) => {
  try {
    let {
      feedback,
      image,
      userId,
    } = req.body;

    const post = await new FeedbackFeed({
      feedback,
      image,
      postedBy: userId,
    }).save();

    if(req.body.image){
      let folderPath = path.join(__dirname, `../public/post/${post._id}`);

          fs.mkdir(folderPath, { recursive: true }, async (err) => {
              if (err) await FeedbackFeed.findOneAndDelete({ _id: post._id });
          });

      let fileName = image.split('/').pop();

      moveFiles(folderPath, fileName);

      post.image = `media/post/${post._id}/${fileName}`;
    }

        await post.save();
        
        global.ioInstance.emit("newPostAlertForAdmin",{
            message : "New post created",
        });
      
    res.json(post);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getFeedbackWithPagination = async (req, res) => {
  try {
    const currentPage = req.query.pageNumber || 1;
    const perPage = req.query.limit || 3;
    let totalItems;
    let totalPages;
    let startDate = dayjs().tz("America/Toronto").startOf('day');
    let endDate = dayjs().tz("America/Toronto").endOf('day').add(1,'hour');
    let today = dayjs().tz('America/Toronto');
    let totalNonVerified;
    totalNonVerified = await FeedbackFeed.countDocuments({ verified: false });
    const posts = await FeedbackFeed.find()
      .countDocuments({verified: true})
      .then(count => {
        totalItems = count;
        totalPages = Math.ceil(totalItems / perPage);
        return FeedbackFeed.aggregate([
          {
            $addFields: {
              eventDate: {
                $dateFromString: {
                  dateString: "$eventDate",
                  format: "%m/%d/%Y",
                  timezone: "America/Toronto",
                },
              },
            }
          },
          {
            $match: {
              verified: true,
              eventDate: {
                $gte: startDate.toDate(),
                // $lt: endDateFormatted // You can add this if needed
              }
            }
          },
          {
            $sort: {
              eventDate: 1,
              eventTime: 1
            }
          },
          {
            $skip: (currentPage - 1) * perPage
          },
          {
            $lookup: {
              from: "users",
              localField: "postedBy",
              foreignField: "_id",
              as: "postedBy",
            }
          },
          {
            $unwind: {
              path: "$postedBy",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            // convert back event date
            $addFields: {
              eventDate: {
                $dateToString: {
                  date: "$eventDate",
                  format: "%m/%d/%Y",
                  timezone: "America/Toronto",
                },
              },
            }
          }
        ]);
      })
      .then(posts => {
        res.status(200).json({posts, totalItems, totalPages, totalNonVerified});
      })
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getSingleFeedback = async (req, res) => {
  try {
    const {postId} = req.params;

    const post = await FeedbackFeed.findOne({_id: postId})
      .populate('postedBy', '_id name')

    res.json(post);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.updateFeedback = async (req, res) => {
  try {
    const {postId} = req.params;
    
    let {
      feedback,
      image,
      instagram,
      website,
      description,
      category
    } = req.body;

    let folderPath = path.join(__dirname, `../public/post/${postId}`);


    fs.mkdir(folderPath, {recursive: true}, async err => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err.message,
        });
      }
    });

    let fileName = image.split('/').pop();

    moveFiles(folderPath, fileName);

    image = `media/post/${postId}/${fileName}`;

    const post = await FeedbackFeed.findOneAndUpdate(
      {_id: postId},
      {
        feedback,

        image,
        organizationName,
        description,
        website,
        instagram,
        eventDate,
        eventTime,
        eventLocation,
        eventLocationDescription,
        category
      },
      {new: true},
    );

    res.json(post);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const {postId} = req.params;

    const post = await FeedbackFeed.findOneAndDelete({_id: postId});

    res.json(post);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getFeedbackByUser = async (req, res) => {
  try {
    const {userId} = req.params;

    const posts = await FeedbackFeed.find({postedBy: userId})
      .populate('postedBy', '_id name');

    res.json(posts);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

