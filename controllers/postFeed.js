//require('dotenv').config({ path: '.env' });
//dotenv.config({ path: './config.env' });
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const PostFeed = require('../models/postFeed');
const RsvpSchema = require('../models/rsvp');
const userPosts = require('../models/userPosts');
const Ticket = require('../models/ticket');
const Organization = require('../models/organization');

const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

const { moveFiles } = require('../helpers/fileMove');
const { fetchPosts } = require('../helpers/scheduler');
const { sendEmail } = require('../helpers/email');
const { sendNotification } = require('../utils/sendNotification');

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone');
const userForRsvp = require('../models/userForRsvp');
const UserRSVP = require('../models/userRSVP');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
dayjs.extend(utc)
dayjs.extend(timezone)


exports.createTicket = async (req, res) => {
  try {
    let {
      eventDate,
      organizationName,
      eventLocationDescription,
      eventLocation,
      eventTime,
      title,
      body,
      image,
      userId,
      instagram,
      website,
      description,
      category,
      link,
      eventEndTime,
      isNorth,
      isCentral,
      organization,
      rsvpData,
      lat,
      lng,
      tickets
    } = req.body;

    console.log(req.body);

    const post = await new PostFeed({
      title,
      body,
      image,
      organizationName,
      description,
      website,
      instagram,
      eventDate,
      eventTime,
      eventLocation,
      eventLocationDescription,
      lat,
      lng,
      postedBy: userId,
      category,
      link,
      eventEndTime,
      campus: isNorth ? 'north' : isCentral ? 'central' : 'all',
      organization,
      eventType: 'Ticketing'
    }).save();

    if (rsvpData) {
      const rsvp = await RsvpSchema.create({
        ...rsvpData,
        post: post._id
      });
      await PostFeed.findByIdAndUpdate(post._id, { rsvp: rsvp._id });
    }

    let createdTickets = [];
    if (tickets && tickets.length > 0) {
      const org = await Organization.findById(organization);
      const stripeAccountId = org.stripeAccountId;

      const ticketDocuments = await Promise.all(tickets.map(async (ticket) => {
        // Create a Stripe product
        const product = await stripe.products.create(
          {
            //name: title,
            name: ticket.name,
            description: ticket.description,
          },
          { stripeAccount: stripeAccountId }
        );
        
        // Create a Stripe price
        const price = await stripe.prices.create(
          {
            unit_amount: ticket.price * 100, // price in cents
            currency: 'usd',
            product: product.id,
          },
          { stripeAccount: stripeAccountId }
        );

        return {
          event: post._id,
          description: ticket.description,
          price: ticket.price,
          availableQuantity: ticket.available,
          stripeProductId: product.id,
          stripePriceId: price.id,
          organization
        };
      }));

      //const createdTickets = await Ticket.insertMany(ticketDocuments);
      createdTickets = await Ticket.insertMany(ticketDocuments);

      const ticketIds = createdTickets.map(ticket => ticket._id);
      await PostFeed.findByIdAndUpdate(post._id, { ticketing: ticketIds });
    }

    if (req.body.image) {
      let folderPath = path.join(__dirname, `../public/post/${post._id}`);

      fs.mkdir(folderPath, { recursive: true }, async (err) => {
        if (err) await PostFeed.findOneAndDelete({ _id: post._id });
      });

      let fileName = image.split('/').pop();

      moveFiles(folderPath, fileName);

      post.image = `media/post/${post._id}/${fileName}`;
    }

    await post.save();

    res.json({ post, tickets: createdTickets });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
/*exports.createTicket = async (req, res) => {
  try {
    let {
      eventDate,
      organizationName,
      eventLocationDescription,
      eventLocation,
      eventTime,
      title,
      body,
      image,
      userId,
      instagram,
      website,
      description,
      category,
      link,
      eventEndTime,
      isNorth,
      isCentral,
      organization,
      rsvpData,
      lat,
      lng,
      tickets
    } = req.body;

    console.log(req.body);

    const post = await new PostFeed({
      title,
      body,
      image,
      organizationName,
      description,
      website,
      instagram,
      eventDate,
      eventTime,
      eventLocation,
      eventLocationDescription,
      lat,
      lng,
      postedBy: userId,
      category,
      link,
      eventEndTime,
      campus: isNorth ? 'north' : isCentral ? 'central' : 'all',
      organization,
      eventType: 'Ticketing'
    }).save();

    if (rsvpData) {
      const rsvp = await RsvpSchema.create({
        ...rsvpData,
        post: post._id
      });
      await PostFeed.findByIdAndUpdate(post._id, { rsvp: rsvp._id });
    }

    const ticketDocuments = tickets.map(ticket => ({
      event: post._id,
      description: ticket.description,
      price: ticket.price,
      availableQuantity: ticket.available,
      organization
    }));

    const createdTickets = await Ticket.insertMany(ticketDocuments);

    const ticketIds = createdTickets.map(ticket => ticket._id);
    await PostFeed.findByIdAndUpdate(post._id, { ticketing: ticketIds });

    if (req.body.image) {
      let folderPath = path.join(__dirname, `../public/post/${post._id}`);

      fs.mkdir(folderPath, { recursive: true }, async (err) => {
        if (err) await PostFeed.findOneAndDelete({ _id: post._id });
      });

      let fileName = image.split('/').pop();

      moveFiles(folderPath, fileName);

      post.image = `media/post/${post._id}/${fileName}`;
    }

    await post.save();

    res.json({ post, tickets: createdTickets });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};*/
/*exports.createTicket = async (req, res) => {
  try {
    let {
      eventDate,
      organizationName,
      eventLocationDescription,
      eventLocation,
      eventTime,
      title,
      body,
      image,
      userId,
      instagram,
      website,
      description,
      category,
      link,
      eventEndTime,
      isNorth,
      isCentral,
      organization,
      rsvpData,
      lat,
      lng,
      tickets
    } = req.body;

    console.log(req.body);

    const post = await new PostFeed({
      title,
      body,
      image,
      organizationName,
      description,
      website,
      instagram,
      eventDate,
      eventTime,
      eventLocation,
      eventLocationDescription,
      lat,
      lng,
      postedBy: userId,
      category,
      link,
      eventEndTime,
      campus: isNorth ? 'north' : isCentral ? 'central' : 'all',
      organization,
      eventType: 'Ticketing'
    }).save();

    if (rsvpData) {
      const rsvp = await RsvpSchema.create({
        ...rsvpData,
        post: post._id
      });
      await PostFeed.findByIdAndUpdate(post._id, { rsvp: rsvp._id });
    }

    if (tickets && tickets.length > 0) {
      const ticketData = tickets[0];
      const org = await Organization.findById(organization);
      const stripeAccountId = org.stripeAccountId;

      // Create a Stripe product
      const product = await stripe.products.create(
        {
          name: title,
          description: description,
        },
        { stripeAccount: stripeAccountId }
      );
      // Create a Stripe price
      const price = await stripe.prices.create(
        {
          unit_amount: ticketData.price * 100, // price in cents
          currency: 'usd',
          product: product.id,
        },
        { stripeAccount: stripeAccountId }
      );
      const ticket = await new Ticket({
        event: post._id,
        price: ticketData.price,
        availableQuantity: ticketData.available,
        stripeProductId: product.id,
        stripePriceId: price.id,
        organization
      }).save();

      await PostFeed.findByIdAndUpdate(post._id, { ticketing: ticket._id });
    }

    if (req.body.image) {
      let folderPath = path.join(__dirname, `../public/post/${post._id}`);

      fs.mkdir(folderPath, { recursive: true }, async (err) => {
        if (err) await PostFeed.findOneAndDelete({ _id: post._id });
      });

      let fileName = image.split('/').pop();

      moveFiles(folderPath, fileName);

      post.image = `media/post/${post._id}/${fileName}`;
    }

    await post.save();

    res.json({ post });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};*/

exports.createPost = async (req, res) => {
  try {
    let {
      eventDate,
      organizationName,
      eventLocationDescription,
      eventLocation,
      eventTime,
      title,
      body,
      image,
      userId,
      instagram,
      website,
      description,
      category,
      link,
      eventEndTime,
      isNorth,
      isCentral,
      //fields for organization data
      // orgRefId = '',
      // rsvp, //will be used after org rsvp creationm
      // eligible,
      organization,
      // rsvp data if exists
      rsvpData,
      lat,
      lng
    } = req.body;

    console.log(req.body);

    const post = await new PostFeed({
      title,
      body,
      image,
      organizationName,
      description,
      website,
      instagram,
      eventDate,
      eventTime,
      eventLocation,
      eventLocationDescription,
      lat,
      lng,
      postedBy: userId,
      category,
      link,
      eventEndTime,
      campus: isNorth ? 'north' : isCentral ? 'central' : 'all',
      organization
    }).save();

    if (rsvpData) {
      const rsvp = await RsvpSchema.create({
        ...rsvpData,
        post: post._id
      })
      await PostFeed.findByIdAndUpdate(post._id, { rsvp: rsvp._id })
    }

    if (req.body.image) {
      let folderPath = path.join(__dirname, `../public/post/${post._id}`);

      fs.mkdir(folderPath, { recursive: true }, async (err) => {
        if (err) await PostFeed.findOneAndDelete({ _id: post._id });
      });

      let fileName = image.split('/').pop();

      moveFiles(folderPath, fileName);

      post.image = `media/post/${post._id}/${fileName}`;
    }

    await post.save();

    /*global.ioInstance.emit("newPostAlertForAdmin", {
      message: "New post created",
    });

    await sendEmail(
      'hello@thisismdex.com',
      'New MDex Post',
      `A new post has been submitted to the admin panel`,
    );*/

    // get and set notification for this post
    //fetchPosts()

    res.json(post);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getFilteredPost = async (req, res) => {
  try {
    const {
      categories,
      isNorth,
      isCentral
    } = req.query
    const validCategories = ["Clothes", "Food", "Water Bottles", "Swag bag", "Phone Wallets", "Accessories", "Saved Posts", "Freebies Forecast", "Tickets", "Caffeine", "Pizza", "Snacks", "Therapy Dogs", "Hats"];
    let startDate = dayjs().tz("America/Toronto").startOf('day');

    let supportedCategories = [];
    if (!categories || !Array.isArray(categories) || categories.length == 0) {
      supportedCategories = [...validCategories];
    } else {
      for (let i = 0; i < categories.length; i++) {
        if (validCategories.includes(categories[i])) {
          supportedCategories.push(categories[i]);
        }
      }
    }
    let tornotoTime = dayjs().tz('America/Toronto');

    let hour = tornotoTime.get('hour');
    let minute = tornotoTime.get('minute');
    let day = tornotoTime.get('date');
    let month = tornotoTime.get('month') - 1; //month - 1
    let year = tornotoTime.get('year');

    const dated = new Date(year, month, day, hour, minute, 0);

    let today = dayjs().tz('America/Toronto');

    let posts = await PostFeed.aggregate([
      {
        $match: {
          verified: true,
          category: {
            $in: supportedCategories
          },
          campus: isNorth ? 'north' : isCentral ? 'central' : { $in: ['north', 'central', 'all'] },
          $or: [
            {
              eventEndTime: {
                $exists: false
              }
            },
            {
              eventEndTime: {
                $gt: dated
              }
            }
          ]
        }
      },
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
          // verified: true,
          eventDate: {
            $gte: startDate.toDate(),
            // $lt: endDateFormatted // You can add this if needed
          },
        }
      },
      {
        $sort: {
          eventDate: 1,
          eventTime: 1
        }
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
      },
      {
        // add string event end time for spliting (date cannot be split)
        $addFields: {
          stringEventEndTime: {
            $dateToString: {
              date: "$eventEndTime",
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
                    $split: ["$eventDate", "/"],
                  },
                  2,
                ],
              },
              "-",
              {
                $arrayElemAt: [
                  {
                    $split: ["$eventDate", "/"],
                  },
                  0,
                ],
              },
              "-",
              {
                $arrayElemAt: [
                  {
                    $split: ["$eventDate", "/"],
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
              "eventEndTime": {
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
    ]);
    return res.status(200).json({ posts });

  } catch (err) {
    console.log(err)
    return res.status(500).json({
      status: false,
      message: err.message || "Something went wrong",
    });
  }
}

exports.getPostsWithPagination = async (req, res) => {
  try {
    const currentPage = req.query.pageNumber || 1;
    const perPage = req.query.limit || 3;
    let totalItems;
    let totalPages;
    let startDate = dayjs().tz("America/Toronto").startOf('day');
    let endDate = dayjs().tz("America/Toronto").endOf('day').add(1, 'hour');
    let today = dayjs().tz('America/Toronto');
    const now = dayjs().tz()
    console.log('now', now)
    // add 5 hours to the end date
    // today = today.subtract(5, 'hour');
    console.log('today', today)
    const posts = await PostFeed.find()
      .countDocuments({ verified: true })
      .then(count => {
        totalItems = count;
        totalPages = Math.ceil(totalItems / perPage);
        return PostFeed.aggregate([
          {
            $addFields: {
              newEventDate: {
                $dateFromString: {
                  dateString: "$eventDate",
                  format: "%m/%d/%Y",
                  timezone: "America/Toronto",
                },
              },
            },
          },
          {
            $match: {
              verified: true,
              newEventDate: {
                $gte: startDate.toDate(),
                // $lt: endDateFormatted // You can add this if needed
              },
            },
          },
          {
            // add string event end time for spliting (date cannot be split)
            $addFields: {
              stringEventEndTime: {
                $dateToString: {
                  date: "$eventEndTime",
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
                        $split: ["$eventDate", "/"],
                      },
                      2,
                    ],
                  },
                  "-",
                  {
                    $arrayElemAt: [
                      {
                        $split: ["$eventDate", "/"],
                      },
                      0,
                    ],
                  },
                  "-",
                  {
                    $arrayElemAt: [
                      {
                        $split: ["$eventDate", "/"],
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
                  eventEndTime: {
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
          {
            $sort: {
              newEventDate: 1,
              eventTime: 1,
            },
          },
          {
            $skip: (currentPage - 1) * perPage,
          },
          {
            $lookup: {
              from: "users",
              localField: "postedBy",
              foreignField: "_id",
              as: "postedBy",
            },
          },
          {
            $unwind: {
              path: "$postedBy",
              preserveNullAndEmptyArrays: true,
            },
          },
          // {
          //   // convert back event date
          //   $addFields: {
          //     eventDate: {
          //       $dateToString: {
          //         date: "$eventDate",
          //         format: "%m/%d/%Y",
          //         timezone: "America/Toronto",
          //       },
          //     },
          //   }
          // }
        ]);
      })
      .then(posts => {
        res.status(200).json({ posts, totalItems, totalPages });
      })
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getSinglePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await PostFeed.findOne({ _id: postId }).populate('rsvp')
      .populate('postedBy', '_id name');
    let postSaves = await UserRSVP.find({ postId: post._id }).count()
    post.numOfSaves = postSaves

    let temp = { ...post.toJSON() }
    temp['numOfSaves'] = postSaves
    res.json(temp);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;

    let {
      eventDate,
      organizationName,
      eventLocationDescription,
      eventLocation,
      eventEndTime,
      eventTime,
      title,
      body,
      image,
      instagram,
      website,
      description,
      category
    } = req.body;

    let folderPath = path.join(__dirname, `../public/post/${postId}`);


    fs.mkdir(folderPath, { recursive: true }, async err => {
      if (err) {
        return res.status(500).json({
          status: false,
          message: err.message,
        });
      }
    });

    if (image) {
      let fileName = image.split('/').pop();

      moveFiles(folderPath, fileName);

      image = `media/post/${postId}/${fileName}`;

    }

    const post = await PostFeed.findOneAndUpdate(
      { _id: postId },
      {
        title,
        body,
        image,
        organizationName,
        description,
        website,
        instagram,
        eventDate,
        eventEndTime,
        eventTime,
        eventLocation,
        eventLocationDescription,
        category
      },
      { new: true },
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

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await PostFeed.findOneAndDelete({ _id: postId });

    res.json(post);
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const { orgId } = req.params;

    const posts = await PostFeed.find({ postedBy: userId })
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
exports.getPostsByOrganization = async (req, res) => {
  try {
    console.log('req.params: ', req.params);
    console.log('req.query: ', req.query);
    const { orgId } = req.params;
    const { category, offset = 0, limit = 10 } = req.query; // Assuming the parameter is named "category"

    let query = {};
    if (category === 'upcoming') {
      query = { eventDate: { $gte: dayjs().format('MM/DD/YYYY') } }; // Fetch upcoming events
    } else if (category === 'past') {
      query = { eventDate: { $lt: dayjs().format('MM/DD/YYYY') } }; // Fetch past events
    }
    const posts = await PostFeed.find({ ...query, organization: orgId }).populate('organization', 'rsvp').limit(limit).skip(offset)
    const total = await PostFeed.find({ ...query, organization: orgId }).count();

    res.json({ posts, total });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getTotalPostsByOrganization = async (req, res) => {
  try {
    console.log('req.params: ', req.params);
    const { orgId } = req.params;

    // get the total number of posts for this org
    const totalPosts = await PostFeed.countDocuments({ organization: orgId });

    // get all the posts posted by this org
    const organizationPosts = await PostFeed.find({ organization: orgId });

    // Extract the IDs of these posts
    const postIds = organizationPosts.map(post => post._id);

    // Count the total number of saves for these posts
    const totalSaves = await userPosts.countDocuments({ postId: { $in: postIds } });

    res.json({ totalPosts, totalSaves });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getPostSaves = async (req, res) => {
  try {
    const { postId } = req.params;
    const totalSaves = await userPosts.countDocuments({ postId });

    res.json({ totalSaves });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.exploreScreen = async (req, res) => {
  // get hotest posts and get today posts
  try {
    let startDate = dayjs().tz("America/Toronto").startOf('day');
    let hotestPosts = userPosts.aggregate([
      {
        $lookup: {
          from: "postfeeds",
          localField: "postId",
          foreignField: "_id",
          as: "userPosts"
        }
      },
      {
        $unwind: {
          path: "$userPosts",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          "userPosts.eventDate": {
            $dateFromString: {
              dateString: "$userPosts.eventDate",
              format: "%m/%d/%Y",
              timezone: "America/Toronto",
            },
          },
        }
      },
      {
        $match: {
          "userPosts.eventDate": {
            $gte: startDate.toDate(),
          },
          "userPosts.verified": true
        }
      },
      {
        $group: {
          _id: "$userPosts._id",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1, // Sort by count in descending order
        },
      },
      {
        $limit: 4, // Limit the results to the top 4 counts
      },
    ])
      .then(async (posts) => {
        let postIds = posts.map(post => post._id);
        let hotestPosts = await PostFeed.find({
          _id: { $in: postIds },
        })
          .populate('postedBy', '_id name')

        //sort the hotest posts by the post
        let sorted = []
        for (let i = 0; i < posts.length; i++) {
          let post = hotestPosts.find(it => it._id.toString() === posts[i]._id.toString());
          sorted.push(post);
        }

        return sorted;
      })
    let todayPosts = PostFeed.find({
      eventDate: {
        $gte: dayjs().tz("America/Toronto").startOf('day').format('MM/DD/YYYY'),
        $lte: dayjs().tz("America/Toronto").endOf('day').format('MM/DD/YYYY')
      },
      verified: true
    })
      .populate('postedBy', '_id name')
      .sort({
        eventDate: 1,
        eventTime: 1
      });
    [hotestPosts, todayPosts] = await Promise.allSettled([hotestPosts, todayPosts]);

    return res.json({ hotestPosts: hotestPosts.value, todayPosts: todayPosts.value });
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
}