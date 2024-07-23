const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51OZhCqAA6SMOc61uZ64GFdht0qyQHlLlUGghAe9e7RB8ie0pi23vRqy33x6tquiXEFN3dJHR5lHS2CLSiNzi6T7v00KV17fONy');
const Organization = require('../models/organization');
const { getOrganizationByEmail, createOrganization, updateOrganization, getAnalytics } = require('../controllers/organization');
const {createPost, getPostSaves, getPostsWithPagination, getPostsByUser, getSinglePost, deletePost, updatePost, exploreScreen, getFilteredPost, getPostsByOrganization, getTotalPostsByOrganization} = require("../controllers/postFeed");


// Helper function to get the Stripe account ID from your database
async function getStripeAccountId(organizationId) {
  try {
    const organization = await Organization.findById(organizationId);
    return organization.stripeAccountId;
  } catch (error) {
    console.error('Error fetching Stripe account ID:', error);
    throw error;
  }
}

// Helper function to save the Stripe account ID to your database
async function saveStripeAccountId(organizationId, accountId) {
  try {
    await Organization.findByIdAndUpdate(organizationId, { stripeAccountId: accountId });
  } catch (error) {
    console.error('Error saving Stripe account ID:', error);
    throw error;
  }
}

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

router.post('/stripe/onboard', async (req, res) => {
  console.log("testing");
  const { organizationId } = req.body;

  // Logic to fetch or create the Stripe account
  let account = await getStripeAccountId(organizationId);
  console.log("account: ", account);

  if (!account) {
    console.log("testing222");
    account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // or your organization's country
    });

    // Save the account ID to the database
    await saveStripeAccountId(organizationId, account.id);
  } else if (typeof account === 'string') {
    // If account is a string (ID), convert it to an object with id property
    account = { id: account };
  }

    
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    //refresh_url: `${process.env.FRONTEND_URL}/refresh`,
    //return_url: `${process.env.FRONTEND_URL}/return`,
    refresh_url: 'http://localhost:3000/onboarding/refresh',
    //return_url: 'http://localhost:3000/onboarding/return',
    return_url: 'http://localhost:3000/dashboard/profile',
    type: 'account_onboarding',
  });

  res.json({ url: accountLink.url });
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
//router.post('/stripe/onboard', stripeRoutes);

module.exports = router;

