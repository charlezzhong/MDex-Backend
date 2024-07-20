const express = require('express');

const router = express.Router();

const multer = require('multer');
const fs = require('fs');

//controllers
const { signup, signin, forgotPassword, resetPassword, changePassword, signinGoogle } = require("../controllers/auth");
const {createPost, getPostsWithPagination, getPostsByUser, getSinglePost, deletePost, updatePost, exploreScreen, getFilteredPost, getPostsByOrganization} = require("../controllers/postFeed");
const {createFeedback, getFeedbackWithPagination, getFeedbackByUser, getSingleFeedback, deleteFeedback, updateFeedback} = require("../controllers/feedbackFeed");
const { createUser, updateUser, deleteUser, verifyUser, getUser, getUsers, verifyUserWithLink, sendNotification, getBannerNotifications, saveToken, getNotificationToggles, updateNotification} = require("../controllers/user");
const { adminDeletePost, adminGetPostsWithPagination, adminGetSinglePost, adminUpdatePost, adminVerifyPost, adminDeleteFeedback, adminGetFeedbackWithPagination , adminGetSingleFeedback, adminUpdateFeedback, adminVerifyFeedback, adminLogin, adminChangePassword, getTotalUsers, getNewUsersToday, getTotalSavedPosts, adminGetVerifiedPosts, adminGetUnverifiedPosts } = require("../controllers/admin");
const {imageUpload, uploadImage} = require("../controllers/uploadImage");
const UserPost = require('../controllers/userposts')
const UserRSVP = require('../controllers/userattending')
const adminMiddleware = require('../middleware/admin');
//const authMiddleware = require('../middleware/jwt');
const authMiddleware = require('../middleware/mdex_app');
const { getOrganizationByEmail, createOrganization, updateOrganization, getAnalytics } = require('../controllers/organization');
const { createStaff, updateStaff, getStaffMember, getAllStaffMembers, deleteStaffMember } = require('../controllers/staff.controller');
const { getRsvpUsers, addRsvpUser } = require('../controllers/userForRsvps');
const { UpdateRsvp } = require('../controllers/rsvpOrg');

const currentTimestamp = Date.now();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const path = `./public/temp/`;
    
    fs.mkdirSync(path, {recursive: true});

    cb(null, path);

    // if body have multiple images then return an array else return single string
    if(Array.isArray(req.files)){
      let media = `/media/temp/${currentTimestamp}_file.${file.originalname.split('.').pop()}`
      req.pictures = req.pictures?.length ? [...req.pictures, media] : [media]
    }else{
      req.picture = `/media/temp/${currentTimestamp}_file.${file.originalname
        .split('.')
        .pop()}`;
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${currentTimestamp}_file.${file.originalname.split('.').pop()}`);
  },
});

const upload = multer({storage});

router.get('/', (req, res) => {
  return res.json({
    data: 'hello world from the API',
  });
});

/*router.post('/signup', signup);
router.post('/signin', signin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware, changePassword)*/
router.post('/signin-google', signinGoogle);
// postFeeds
/*
router.post('/postFeed', authMiddleware, createPost);
router.get('/postFeed', authMiddleware, getPostsWithPagination);
router.get('/postFeed/:postId', authMiddleware, getSinglePost);
router.get('/postFeed/by/:userId', authMiddleware, getPostsByUser);
router.put('/postFeed/:postId', authMiddleware, updatePost);
router.delete('/postFeed/:postId', authMiddleware, deletePost);
router.get('/explore-screen', authMiddleware, exploreScreen);
router.get('/getFilteredPosts', authMiddleware, getFilteredPost);
router.get('/org/postFeed/:orgId', authMiddleware, getPostsByOrganization);*/
// feedbackFeeds
/*
router.post('/feedbackFeed', authMiddleware, createFeedback);
router.get('/feedbackFeed', authMiddleware, getFeedbackWithPagination);
router.get('/feedbackFeed/:postId', authMiddleware, getSingleFeedback);
router.get('/feedbackFeed/by/:userId', authMiddleware, getFeedbackByUser);
router.put('/feedbackFeed/:postId', authMiddleware, updateFeedback);
router.delete('/feedbackFeed/:postId', authMiddleware, deleteFeedback);*/
// users
/*
router.post("/user", adminMiddleware, createUser); //ADMIN
router.get("/user", adminMiddleware, getUsers, getTotalUsers, getNewUsersToday); //ADMIN
router.get('/user/getNotificationToggles', authMiddleware, getNotificationToggles)
router.post('/user/saveToken', authMiddleware, saveToken);
router.post('/user/updateNotification', authMiddleware, updateNotification)
router.get("/user/:userId", authMiddleware, getUser);
router.put("/user/:userId", authMiddleware, updateUser);
router.delete("/user/:userId", authMiddleware, deleteUser);
router.put("/user/verify/:userId", adminMiddleware, verifyUser); 
router.put("/user/verify/:userId/:verificationCode", verifyUserWithLink); // verify user without auth*/

//user saved posts
router.post("/savePost", authMiddleware, UserPost.savePost);
router.get("/getPosts", authMiddleware, UserPost.getPosts)
router.post('/deletePost', authMiddleware, UserPost.deletePost)

//user rsvp posts
router.post("/rsvpPost", authMiddleware, UserRSVP.rsvpPost);
router.get("/getRsvp", authMiddleware, UserRSVP.getRsvp)
router.post('/deleteRsvp', authMiddleware, UserRSVP.deleteRsvp)

//RSVPS for organination
router.get('/org/rsvps/:rsvpId', authMiddleware, getRsvpUsers);
router.post('/org/rsvps', authMiddleware, addRsvpUser);

//rsvp
router.put('/rsvps/:rsvpId', authMiddleware, UpdateRsvp);


// admin
/*
router.post('/admin/login', adminLogin);
router.post('/admin/change/password', adminMiddleware, adminChangePassword);
router.get('/admin/postFeed', adminMiddleware, adminGetPostsWithPagination);
router.get('/admin/postFeed/verified', adminMiddleware, adminGetVerifiedPosts);
router.get('/admin/postFeed/unverified', adminMiddleware, adminGetUnverifiedPosts);
router.get('/admin/postFeed/:postId', adminMiddleware, adminGetSinglePost);
router.get('/admin/savePosts', adminMiddleware, getTotalSavedPosts);
router.put('/admin/postFeed/:postId', adminMiddleware, adminUpdatePost);
router.delete('/admin/postFeed/:postId', adminMiddleware, adminDeletePost);
router.put('/admin/postFeed/verify/:postId', adminMiddleware, adminVerifyPost);
router.get('/admin/feedbackFeed', adminMiddleware, adminGetFeedbackWithPagination);
router.get('/admin/feedbackFeed/:postId', adminMiddleware, adminGetSingleFeedback);
router.put('/admin/feedbackFeed/:postId', adminMiddleware, adminUpdateFeedback);
router.delete('/admin/feedbackFeed/:postId', adminMiddleware, adminDeleteFeedback);
router.put('/admin/feedbackFeed/verify/:postId', adminMiddleware, adminVerifyFeedback);*/
// temImageUpload
router.post('/upload', upload.single('image'), uploadImage);


//notifications
router.get('/getBannerNotifications', getBannerNotifications)
/*router.post('/admin/sendNotification', adminMiddleware, sendNotification);*/


// Organization routes
const organizationRouter = require('./organization');
//router.use('/organization', organizationRouter);
/*
router.post('/organization/getOrganization', getOrganizationByEmail);
router.post('/organization/create',upload.single('orgLogo'), createOrganization);
router.patch('/organization/update/:orgId', upload.array('media',6), updateOrganization);
router.get('/organization/analytics/:orgId', getAnalytics);*/

// Staff Routes
router.post('/staffMember', createStaff);
router.patch('/staffMember/:staffId', updateStaff);
router.get('/staffMember/:staffId', getStaffMember);
router.get('/staffMembers', getAllStaffMembers);
router.delete('/staffMember/:staffId', deleteStaffMember);


module.exports = router;
