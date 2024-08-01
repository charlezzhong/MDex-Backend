const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Organization = require('../models/organization');
const { getOrganizationByEmail, createOrganization, updateOrganization, getAnalytics } = require('../controllers/organization');
const {createPost, createTicket, getPostSaves, getPostsWithPagination, getPostsByUser, getSinglePost, deletePost, updatePost, exploreScreen, getFilteredPost, getPostsByOrganization, getTotalPostsByOrganization} = require("../controllers/postFeed");
const { route } = require('./organization');

const{validate_qr, getTickets, getqrcode} = require('../controllers/transactionController');


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

router.post('/purchaseTicket', async (req, res) => {
  const { ticketId, userId } = req.body;

  try {
    // Fetch ticket details from the database
    const ticket = await Ticket.findById(ticketId);
    const user = await User.findById(userId);
    
    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: ticket.description,
          },
          unit_amount: ticket.price * 100, // amount in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId: user._id.toString(),
        ticketId: ticket._id.toString(),
      },
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const { userId, ticketId, quantity } = session.metadata;
      const qrCode = await generateQRCode(`ticketPurchaseId:${session.payment_intent}`);

      // Create ticket purchase record
      const ticketPurchase = new TicketPurchase({
        user: userId,
        ticket: ticketId,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent,
        purchaseDate: new Date(),
        quantity: parseInt(quantity),
        qrCode: qrCode,
        used: false,
      });

      await ticketPurchase.save();
    } catch (error) {
      console.error('Failed to create ticket purchase record', error);
    }
  }

  res.json({ received: true });
});


router.post('/postFeed/ticket', createTicket);

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
//router.post('/postFeed/ticket', );
//http://localhost:5000/ipa/v2/testing/postFeed/ticket


// the user tries to get all the tickets they have purchased
router.get('/ticket-purchases/:userId', getTickets);
// the user tries to get the qr code for a specific ticket
router.get('/ticket-purchase/:id/qr-code', getqrcode);
// the organization staff scans user's qr code to validate the ticket
router.post('/validate-qr-code', validate_qr);
module.exports = router;

// mainly generate qr code
// athlete ticket list

/*mobile app handling user payment route:
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { Button } from 'react-native';

const PurchaseButton = ({ ticketId, userId }) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const handlePurchase = async () => {
    try {
      // Call your backend to create a checkout session
      const response = await fetch('https://your-backend.com/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId, userId }),
      });
      const { id } = await response.json();

      // Initialize the payment sheet
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: id,
      });
      if (error) {
        console.error('Error initializing payment sheet:', error);
        return;
      }

      // Present the payment sheet
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        console.error('Error presenting payment sheet:', paymentError);
        return;
      }

      // Handle successful payment
      alert('Payment successful!');
    } catch (error) {
      console.error('Error during purchase:', error);
      alert('Something went wrong during the purchase.');
    }
  };

  return (
    <Button title="Purchase" onPress={handlePurchase} />
  );
};

// Wrap your app with StripeProvider in the root component
const App = () => {
  return (
    <StripeProvider publishableKey="your-publishable-key">
      { Your app components }
      </StripeProvider>
    );
  }; */


  /* if we wanna do a split of ticket fee between us and orgs
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  const { ticketId, userId } = req.body;

  try {
    // Fetch ticket details from the database
    const ticket = await Ticket.findById(ticketId).populate('organization');
    const user = await User.findById(userId);
    const org = ticket.organization;
    const stripeAccountId = org.stripeAccountId;

    // Calculate application fee (20% of the ticket price)
    const applicationFeeAmount = Math.round(ticket.price * 0.20 * 100); // amount in cents

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: ticket.description,
          },
          unit_amount: ticket.price * 100, // amount in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      metadata: {
        userId: user._id.toString(),
        ticketId: ticket._id.toString(),
      },
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccountId, // Specify the connected account ID here
        },
      },
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};*/