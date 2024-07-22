const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51PeIpp2MY7TItQOFS45S6SARIfb8DAfKig9m3iTZfqjHlUkGcwwm9hfe8FSlr6vtq0coGTVTymPhpTkttTjq4M9t00p9YVMxOM');
//const Organization = require('../models/organization');
const { getOrganizationByEmail, createOrganization, updateOrganization, getAnalytics } = require('../controllers/organization');
const {createPost, getPostSaves, getPostsWithPagination, getPostsByUser, getSinglePost, deletePost, updatePost, exploreScreen, getFilteredPost, getPostsByOrganization, getTotalPostsByOrganization} = require("../controllers/postFeed");

// Create a Stripe account for the organization
router.post('/create-stripe-account', async (req, res) => {
  try {
    const { organizationId, email } = req.body;
    console.log('stripe info: ', stripe);

    // Create a Stripe account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // or your organization's country
      email: email,
    });

    // Update the organization with the Stripe account ID
    await Organization.findByIdAndUpdate(organizationId, {
      stripeAccountId: account.id,
    });

    res.status(200).json({ success: true, accountId: account.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create Stripe account' });
  }
});

// Add a payment method to the Stripe account
router.post('/setup-payment-method', async (req, res) => {
  try {
    const { organizationId, paymentMethodId } = req.body;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    // Attach the payment method to the Stripe account
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: organization.stripeAccountId,
    });

    // Set the default payment method
    await stripe.accounts.update(organization.stripeAccountId, {
      default_payment_method: paymentMethodId,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to setup payment method' });
  }
});


/*router.post('/postFeed', async (req, res) => {
  try {
    console.log("received");
    console.log('Request:', req);
    res.status(200).json({ success: true});
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create Stripe account' });
  }
});*/
router.post('/postFeed', createPost);
//router.post('/postFeed/summary', getPostsByOrganization);
router.get('/getNum/:orgId', getTotalPostsByOrganization);
router.get('/org/postFeed/:orgId', getPostsByOrganization);
router.get('/post/:postId/saves', getPostSaves);
router.get('/postFeed/:postId', getSinglePost);

module.exports = router;

