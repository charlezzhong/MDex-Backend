const express = require('express');
const router = express.Router();
//const fs = require('fs');

const feedbackController = require("../controllers/feedbackFeed");
const authMiddleware = require('../middleware/jwt');

router
    .route('/')
    .post(authMiddleware, feedbackController.createFeedback)
    .get(authMiddleware, feedbackController.getFeedbackWithPagination);

router
    .route('/:postId')
    .get(authMiddleware, feedbackController.getSingleFeedback)
    .put(authMiddleware, feedbackController.updateFeedback)
    .delete(authMiddleware, feedbackController.deleteFeedback);

router
    .route('/by/:userId')
    .get(authMiddleware, feedbackController.getFeedbackByUser);

module.exports = router;