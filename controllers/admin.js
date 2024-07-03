const User = require("../models/user");
const PostFeed = require("../models/postFeed");
const FeedbackFeed = require("../models/feedbackFeed");
const { comparePassword, hashPassword } = require("../helpers/auth");
const jwt = require("jsonwebtoken");
const { sendNotification } = require("../utils/sendNotification");
const UserPosts = require("../models/userPosts");
const { OAuth2Client } = require("google-auth-library");


const client = new OAuth2Client("1096811347098-1mhpfdp94th2gqj26ujqe9dcuaqeo459.apps.googleusercontent.com");

exports.adminLogin = async (req, res) => {
    try {
      const { email, password, token } = req.body;
  
      let user;
      if (token) {
        // Google Sign-In flow
        const ticket = await client.verifyIdToken({
          idToken: token,
          //audience: process.env.GOOGLE_CLIENT_ID,
          audience: "1096811347098-1mhpfdp94th2gqj26ujqe9dcuaqeo459.apps.googleusercontent.com",
        });
        const payload = ticket.getPayload();
  
        if (payload.email_verified && payload.email) {
          // Check if the user already exists in the database
          user = await User.findOne({ email: payload.email, role: "Admin" });
          if (!user) {
            // Optionally, create a new user if they don't exist
            user = new User({
              email: payload.email,
              name: payload.name,
              role: "Admin",
              // Add any other necessary fields here
            });
            await user.save();
          }
        } else {
          return res.status(400).send("Google Sign-In failed. Try again.");
        }
      } else {
        // Email/Password flow
        user = await User.findOne({ email, role: "Admin" });
        if (!user) {
          return res.status(500).send("An error occurred. Please try again later.");
        }
  
        // Check password
        const match = await comparePassword(password, user.password);
        if (!match) {
          return res.status(500).send("An error occurred. Please try again later.");
        }
      }
  
      // Create signed token
      const jwtToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      user.password = undefined;
      user.secret = undefined;
      res.json({
        token: jwtToken,
        user,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).send("Error. Try again.");
    }
  };

  exports.adminGetVerifiedPosts = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.pageNumber) || 1;
        const perPage = parseInt(req.query.limit) || 3;
        const searchQuery = req.query.search || '';
        let totalItems;
        let totalPages;

        // Build search criteria
        const searchCriteria = { verified: true };
        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i'); // 'i' for case insensitive
            searchCriteria.$or = [
                { title: regex },
                { body: regex },
                { description: regex },
                { eventLocation: regex }
            ];
        }

        // Fetch total item count and calculate total pages
        totalItems = await PostFeed.countDocuments(searchCriteria);
        totalPages = Math.ceil(totalItems / perPage);

        // Fetch posts based on pagination and search criteria
        const posts = await PostFeed.find(searchCriteria)
            .skip((currentPage - 1) * perPage)
            .populate("postedBy", "_id name email")
            .sort({ createdAt: -1 })
            .limit(perPage);

        // Aggregate user post data
        const postIds = posts.map(post => post._id);
        const result = await UserPosts.aggregate([
            {
                $match: {
                    postId: { $in: postIds }
                }
            },
            {
                $group: {
                    _id: '$postId',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Add count data to posts
        posts.forEach(post => {
            const countData = result.find(item => item._id.toString() === post._id.toString());
            post._doc.count = countData ? countData.count : 0;
        });

        return res.status(200).json({ posts, totalItems, totalPages });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: false,
            message: err.message,
        });
    }
};


// Another version of adminGetVerifiedPosts
/*exports.adminGetVerifiedPosts = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.pageNumber) || 1;
        const perPage = parseInt(req.query.limit) || 3;
        const searchQuery = req.query.search || '';
        let totalItems;
        let totalPages;

        // Build search criteria
        const searchCriteria = { verified: true };
        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i'); // 'i' for case insensitive
            searchCriteria.$or = [
                { title: regex },
                { body: regex },
                { description: regex },
                { eventLocation: regex }
            ];
        }

        const posts = await PostFeed.find(searchCriteria)
            .countDocuments()
            .then((count) => {
                totalItems = count;
                totalPages = Math.ceil(totalItems / perPage);
                return PostFeed.find(searchCriteria)
                    .skip((currentPage - 1) * perPage)
                    .populate("postedBy", "_id name email")
                    .sort({ createdAt: -1 })
                    .limit(perPage);
            })
            .then(async (posts) => {
                let postIds = posts.map((post) => post._id);
                let result = await UserPosts.aggregate([
                    {
                        $match: {
                            postId: {
                                $in: postIds
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '$postId',
                            count: { $sum: 1 }
                        }
                    },
                ]);

                for (const post of posts) {
                    let count = result.find((item) => item._id.toString() == post._id.toString());
                    post._doc.count = count ? count.count : 0;
                }

                return res.status(200).json({ posts: posts, totalItems, totalPages });
            })
            .catch((err) => {
                return res.status(500).json({
                    status: false,
                    message: err.message,
                });
            });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });
    }
};*/

exports.adminGetUnverifiedPosts = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.pageNumber) || 1;
        const perPage = parseInt(req.query.limit) || 3;
        let totalItems;
        let totalPages;

        const posts = await PostFeed.find({ verified: false })  // Filter for not verified posts
            .countDocuments()
            .then((count) => {
                totalItems = count;
                totalPages = Math.ceil(totalItems / perPage);
                return PostFeed.find({ verified: false })  // Filter for not verified posts
                    .skip((currentPage - 1) * perPage)
                    .populate("postedBy", "_id name email")
                    .sort({ createdAt: -1 })
                    .limit(perPage);
            })
            .then(async (posts) => {
                let postIds = posts.map((post) => post._id);
                let result = await UserPosts.aggregate([
                    {
                        $match: {
                            postId: {
                                $in: postIds
                            }
                        }
                    },
                    {
                        $group: {
                            _id: '$postId',
                            count: { $sum: 1 }
                        }
                    },
                ]);

                for (const post of posts) {
                    let count = result.find((item) => item._id.toString() == post._id.toString());
                    post._doc.count = count ? count.count : 0;
                }

                return res.status(200).json({ posts: posts, totalItems, totalPages });
            })
            .catch((err) => {
                return res.status(500).json({
                    status: false,
                    message: err.message,
                });
            });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });
    }
};

  exports.adminGetPostsWithPagination = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.pageNumber) || 1;
        const currentPageVerified = parseInt(req.query.pageNumberVerified) || 1;
        const currentPageNonVerified = parseInt(req.query.pageNumberNonVerified) || 1;
        const perPage = parseInt(req.query.limit) || 3;

        let totalItems, totalPages, totalVerified, totalNonVerified, totalPagesVerified, totalPagesNonVerified;
        let totalTesting;
        let total_category;
        const postType = req.query.postType || 'all';

        let queryCondition = {};
        if (postType === 'verified') {
            queryCondition.verified = true;
        } else if (postType === 'nonVerified') {
            queryCondition.verified = false;
        }

        totalVerified = await PostFeed.countDocuments({ verified: true });
        totalNonVerified = await PostFeed.countDocuments({ verified: false });
        totalPagesVerified = Math.ceil(totalVerified / perPage);
        totalPagesNonVerified = Math.ceil(totalNonVerified / perPage);
        totalTesting = totalVerified+500;
        totalClothes = await PostFeed.countDocuments( { category: "Clothes" } );
        totalSnacks = await PostFeed.countDocuments( { category: "Snacks" } );
        totalFood = await PostFeed.countDocuments( { category: "Food" } );
        totalPizza = await PostFeed.countDocuments( { category: "Pizza" } );
        totalCaffeine = await PostFeed.countDocuments( { category: "Caffeine" } );
        totalAccessories = await PostFeed.countDocuments( { category: "Accessories" } );


        // Get today's date and set time to the start of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get tomorrow's date and set time to the start of the day
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Count posts created today
        const totalPostsToday = await PostFeed.countDocuments({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // Count unverified posts created today
        const totalUnverifiedPostsToday = await PostFeed.countDocuments({
            verified: false,
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        });


        let adjust = (currentPage - 1) * perPage;
        if (postType === 'verified') {
            adjust = (currentPageVerified - 1) * perPage;
        } else if (postType === 'nonVerified') {
            adjust = (currentPageNonVerified - 1) * perPage;
        }

        const posts = await PostFeed.find(queryCondition)
            .countDocuments()
            .then((count) => {
                totalItems = count;
                totalPages = Math.ceil(totalItems / perPage);
                return PostFeed.find(queryCondition)
                    .skip(adjust)
                    .populate("postedBy", "_id name email")
                    .sort({ createdAt: -1 })
                    .limit(perPage)
            })
            .then(async (posts) => {
                let postIds = posts.map((post) => post._id);
                let result = await UserPosts.aggregate([
                    {
                        $match: {
                            postId: { $in: postIds }
                        }
                    },
                    {
                        $group: {
                            _id: '$postId',
                            count: { $sum: 1 }
                        }
                    },
                ]);

                let totalCount = 0;
                posts.forEach((post) => {
                    let count = result.find((item) => item._id.toString() === post._id.toString());
                    post._doc.count = count ? count.count : 0;
                    totalCount += post._doc.count;
                });

                return res.status(200).json({
                    posts,
                    totalItems,
                    totalPages,
                    postType,
                    totalVerified,
                    totalNonVerified,
                    totalPagesVerified,
                    totalPagesNonVerified,
                    totalTesting,
                    totalCount,
                    totalPostsToday,
                    totalUnverifiedPostsToday,
                    //Categories
                    totalClothes,
                    totalSnacks,
                    totalFood,
                    totalPizza,
                    totalCaffeine,
                    totalAccessories,
                    currentPage: postType === 'all' ? currentPage : postType === 'verified' ? currentPageVerified : currentPageNonVerified,
                });
            })
            .catch((err) => {
                return res.status(500).json({
                    status: false,
                    message: err.message,
                });
            });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            message: err.message,
        });
    }
};

// New function to get the total number of users
exports.getTotalUsers = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({role: "Subscriber"});
        res.status(200).json({ totalUsers });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, message: err.message });
    }
};

exports.getTotalSavedPosts = async (req, res) => {
    try {
        // Get today's date and set time to the start of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get tomorrow's date and set time to the start of the day
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const totalSaved = await UserPosts.countDocuments();

        // Count total saved posts created today
        const totalSavedToday = await UserPosts.countDocuments({
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        });
        res.status(200).json({ totalSaved, totalSavedToday });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, message: err.message });
    }
};

// Function to get the number of new users today
exports.getNewUsersToday = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const newUsersToday = await User.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        res.status(200).json({ newUsersToday });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, message: err.message });
    }
};

exports.adminGetSinglePost = async (req, res) => {
    try {

        const { postId } = req.params;

        const post = await PostFeed.findOne({ _id: postId })
            .populate("postedBy", "_id name")

        res.json(post);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.adminUpdatePost = async (req, res) => {
    try {

        const { postId } = req.params;

        const { title, body, image } = req.body;

        const post = await PostFeed.findOneAndUpdate(
            { _id: postId },
            { title, body, image },
            { new: true }
        );

        res.json(post);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.adminDeletePost = async (req, res) => {
    try{

        const { postId } = req.params;

        const post = await PostFeed.findOneAndDelete({ _id: postId });

        res.json(post);

    }catch(err){

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
};

exports.adminVerifyPost = async (req, res) => {
    try{

        const { postId } = req.params;

        const post = await PostFeed.findOneAndUpdate(
            { _id: postId },
            { verified: true },
            { new: true }
        );

        global.ioInstance.emit("postApprove",{
            message : "post approve",
        });
        sendNotification(post);
        res.json(post);

    }catch(err){

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.adminGetFeedbackWithPagination = async (req, res) => {
    try {

        const currentPage = req.query.pageNumber || 1;
        const perPage = req.query.limit || 3;
        let totalItems;
        let totalPages; 
        let totalNonVerified;
        totalNonVerified = await FeedbackFeed.countDocuments({ verified: false });
        // Get today's date and set time to the start of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get tomorrow's date and set time to the start of the day
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Count total non-verified feedback created today
        const totalNonVerifiedToday = await FeedbackFeed.countDocuments({
            verified: false,
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        });
        
        const posts = await FeedbackFeed.find()
            .countDocuments()
            .then((count) => {
                totalItems = count;
                totalPages = Math.ceil(totalItems / perPage);
                return FeedbackFeed.find()
                    .skip((currentPage - 1) * perPage)
                    .populate("postedBy", "_id name email")
                    .sort({ createdAt: -1 })
                    .limit(perPage)
            })
            .then(async(posts) => {
                let postIds = posts.map((post) => post._id);
                let result = await UserPosts.aggregate([
                    {
                        $match: {
                            postId: {
                                $in: postIds
                            }
                        }
                    },
                    {
                        $group: {
                          _id: '$postId',
                          count: { $sum: 1 }
                        }
                    },
                ])
                
                for(const post of posts){
                    let count = result.find((item) => item._id.toString() == post._id.toString());
                    post._doc.count = count ? count.count : 0;
                }

                return res.status(200).json({posts: posts, totalPages, totalItems,totalNonVerified, totalNonVerifiedToday});
            })
            .catch((err) => {
                return res.status(500).json({
                    status: false,
                    message: err.message,
                });
            });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.adminGetSingleFeedback = async (req, res) => {
    try {

        const { postId } = req.params;

        const post = await FeedbackFeed.findOne({ _id: postId })
            .populate("postedBy", "_id name")

        res.json(post);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.adminUpdateFeedback = async (req, res) => {
    try {

        const { postId } = req.params;

        const { title, body, image } = req.body;

        const post = await FeedbackFeed.findOneAndUpdate(
            { _id: postId },
            { title, body, image },
            { new: true }
        );

        res.json(post);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.adminDeleteFeedback = async (req, res) => {
    try{

        const { postId } = req.params;

        const post = await FeedbackFeed.findOneAndDelete({ _id: postId });

        res.json(post);

    }catch(err){

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
};

exports.adminVerifyFeedback = async (req, res) => {
    try{

        const { postId } = req.params;

        const post = await FeedbackFeed.findOneAndUpdate(
            { _id: postId },
            { verified: true },
            { new: true }
        );

        global.ioInstance.emit("feedbackApprove",{
            message : "feedback approve",
        });
        sendNotification(post);
        res.json(post);

    }catch(err){

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.adminChangePassword = async (req, res) => {
    try{

        let { password,userId, currentPassword  } = req.body;

        const user = await User.findOne({ _id: userId });
      
        if(user.role == 'Admin'){

            if (!user) {

                return res.json({error: 'User not found',status:401});
      
              }
      
              const match = await comparePassword(currentPassword, user.password);
      
              if(!match){
      
                return res.json({
      
                  error: 'Current password is wrong',
                  status:401
      
                });
      
              }
      
           
      
              if(currentPassword == password) {
      
                  return res.json({
      
                    error: 'Current password and new password cannot be same',
                    status:401
      
                  });
      
              }
            
              const hashedPassword = await hashPassword(password);
      
              // Update the user's password in the database
              const updatedUser = await User.findByIdAndUpdate(
                userId,
                { password: hashedPassword },
                { new: true }
              );
            
              if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' ,status:401});
              }
            
              res.json(updatedUser);

        }
        else{

            return res.json({
      
                error: 'Admin not found',
                status:401
    
            });
        }
      

    }catch(err){

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}


// Admin Main: get total number of posts
exports.getTotalPosts = async (req, res) => {
    try {
        const totalPosts = await PostFeed.countDocuments();
        res.status(200).json({ totalPosts });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: false, message: err.message });
    }
};

// Admin Main Page: get total number of unresolved feedback
exports.getTotalUnverifiedFeedback = async (req, res) => {
    try {
      const totalUnverifiedFeedback = await FeedbackFeed.countDocuments({ verified: true });
      res.status(200).json({ totalUnverifiedFeedback });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  };