const express = require('express');
const router = express.Router();
//const fs = require('fs');

const userController = require('../controllers/user');
const adminMiddleware = require('../middleware/admin');
const authMiddleware = require('../middleware/jwt');

router
    .route('/')
    .post(adminMiddleware, userController.createUser) // ADMIN
    .get(adminMiddleware, userController.getUsers); // ADMIN

router
    .route('/getNotificationToggles')
    .get(authMiddleware, userController.getNotificationToggles);

router
    .route('/saveToken')
    .post(authMiddleware, userController.saveToken);

router
    .route('/updateNotification')
    .post(authMiddleware, userController.updateNotification);

router
    .route('/:userId')
    .get(authMiddleware, userController.getUser)
    .put(authMiddleware, userController.updateUser)
    .delete(authMiddleware, userController.deleteUser);

router
    .route('/verify/:userId')
    .put(adminMiddleware, userController.verifyUser);

router
    .route('/verify/:userId/:verificationCode')
    .put(userController.verifyUserWithLink); // verify user without auth

module.exports = router;