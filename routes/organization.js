const express = require('express');
const router = express.Router();
//const fs = require('fs');
const transactionController = require('../controllers/transactionController')
const organizationController = require('../controllers/organization')

// TODO: Refactor definition of "upload" function

// Organization tries to setup their card info
router
    .route('/setup-card')
    .post(transactionController.setupCard);

// Organization tries to create an RSVP event
router
    .route('/createRSVP')
    .post(organizationController.createRSVP);

// Organization tries to create a ticketing event
// (It needs to go through "check stripe account exists" middleware)
router
    .route('/createTicketing')
    .post(transactionController.checkStripe, organizationController.createTicketing);

    
// Organization tries to get all the posts it has created
router
    .route('/getPosts')
    .get(organizationController.getPosts);

// For a specific ticketing event, get all the users who have already purchased it
router
    .route('/getUserTickets')
    .get(organizationController.getUserTickets);

router
    .route('/getOrganization')
    .post(organizationController.getOrganizationByEmail);

router
    .route('/create')
    .post(upload.single('orgLogo'), organizationController.createOrganization);

router
    .route('/update/:orgId')
    .patch(upload.array('media',6), organizationController.updateOrganization);

router
    .route('/analytics/:orgId')
    .get(organizationController.getAnalytics);

module.exports = router;
