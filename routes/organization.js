const express = require('express');
const router = express.Router();
//const fs = require('fs');
const transactionController = require('../controllers/transactionController')
const organizationController = require('../controllers/organization')

// TODO: Refactor definition of "upload" function
/*
router
    .route('/createOrganization')
    .post(organizationController.createOrganization1);


// Organization tries to setup their card info
router
    .route('/setup-card')
    .post(transactionController.setupCard);

// Organization tries to create an RSVP event
// TODO (Done)
router
    .route('/createRSVP')
    .post(organizationController.createRSVP);

// Organization tries to create a ticketing event
// (It needs to go through "check stripe account exists" middleware)
// TODO (Done)
router
    .route('/createTicketing')
    .post(transactionController.checkStripe, organizationController.createTicketing);

    
// Organization tries to get all the posts it has created
// It would include whether it's RSVP / Ticketing
// It would call getUserTickets potentially
// TODO (Done)
router
    .route('/getPosts')
    .get(organizationController.getPosts);

// For a specific RSVP event, get all the users who have already RSVPed it
// TODO (Done)
router
    .route('/getUserRSVPs')
    .get(organizationController.getUserRSVPs);

// For a specific ticketing event, get all the users who have already purchased it
// TODO (Done)
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


// Refactor to user route later!!!
router.route('/user/UserGetPurchased').get(organizationController.getPurchased);
router.route('/user/UserGetRSVP').get(organizationController.getRSVP);


module.exports = router;*/
