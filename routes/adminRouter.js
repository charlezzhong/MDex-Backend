const express = require('express');
const router = express.Router();
//const fs = require('fs');

const adminController = require('../controllers/admin');
const adminMiddleware = require('../middleware/admin');
const userController = require('../controllers/user');

router
    .route('/login')
    .get(adminController.adminLogin);

router
    .route('/change/password')
    .post(adminMiddleware, adminController.adminChangePassword);

router
    .route('/postFeed')
    .get(adminMiddleware, adminController.adminGetPostsWithPagination);

router
    .route('/postFeed/verified')
    .get(adminMiddleware, adminController.adminGetVerifiedPosts);

router
    .route('/postFeed/unverified')
    .get(adminMiddleware, adminController.adminGetUnverifiedPosts);

router
    .route('/postFeed/:postId')
    .get(adminMiddleware, adminController.adminGetSinglePost);

router
    .route('/savePosts')
    .get(adminMiddleware, adminController.getTotalSavedPosts);

router
    .route('/postFeed/:postId')
    .put(adminMiddleware, adminController.adminUpdatePost)
    .delete(adminMiddleware, adminController.adminDeletePost);

router
    .route('/postFeed/verify/:postId')
    .put(adminMiddleware, adminController.adminVerifyPost);

router
    .route('/feedbackFeed')
    .get(adminMiddleware, adminController.adminGetFeedbackWithPagination);

router
    .route('/feedbackFeed/:postId')
    .get(adminMiddleware, adminController.adminGetSingleFeedback)
    .put(adminMiddleware, adminController.adminUpdateFeedback)
    .delete(adminMiddleware, adminController.adminDeleteFeedback);

router
    .route('/feedbackFeed/verify/:postId')
    .put(adminMiddleware, adminController.adminVerifyFeedback);

router
    .route('/sendNotification')
    .post(adminMiddleware, userController.sendNotification);



module.exports = router;