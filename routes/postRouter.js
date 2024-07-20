const express = require('express');
const router = express.Router();
//const fs = require('fs');

const postController = require('../controllers/postFeed');
const authMiddleware = require('../middleware/jwt');

router
    .route('/')
    .post(authMiddleware, postController.createPost)
    .get(authMiddleware, postController.getPostsWithPagination);

router
    .route('/:postId')
    .get(authMiddleware, postController.getSinglePost)
    .put(authMiddleware, postController.updatePost)
    .delete(authMiddleware, postController.deletePost);

router
    .route('/by/:userId')
    .get(authMiddleware, postController.getPostsByUser);

// TODO: REQUIRE modify in the mobile app frontend
router
    .route('/explore-screen')
    .get(authMiddleware, postController.exploreScreen);

router
    .route('/getFilteredPosts')
    .get(authMiddleware, postController.getFilteredPost);

router
    .route('/:orgId')
    .get(authMiddleware, postController.getPostsByOrganization);

module.exports = router;