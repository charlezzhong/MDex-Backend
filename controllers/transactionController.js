const { response } = require("../helpers/responseHandle")
const ticketPurchase = require("../models/ticketPurchase")
const Organization = require("../models/organization")

// Endpoint to handle organizations seting up card request
exports.setupCard = async (req, res) => {
    const { organizationId } = req.body;

    try {
      let organization = await Organization.findById(organizationId);

      if (!organization) {
        return res.status(404).send({ error: 'Organization not found' });
      }

      // Check if organization already has a Stripe account
      if (!organization.stripeAccountId) {
        // If organization doesn't have a Stripe account, create one
        const account = await stripe.accounts.create({
          type: 'express', 
        });

        // Update organization with the new stripeAccountId
        organization.stripeAccountId = account.id;
        await organization.save();
      }

      // Generate account link for organization onboarding
      const accountLink = await stripe.accountLinks.create({
        account: organization.stripeAccountId,
        refresh_url: 'https://thisismdex.com/reauth',
        return_url: 'https://thisismdex.com/success',
        type: 'account_onboarding',
      });

      res.status(200).send({
        url: accountLink.url,
      });
    } catch (error) {
      console.error('Error setting up card:', error);
      res.status(500).send({ error: error.message });
    }
  };

// Middleware to check if the organization has a Stripe account
exports.checkStripe = async (req, res, next) => {
  const organizationId = req.body.organizationId; // or retrieve it from req.user if authenticated
  const organization = await Organization.findById(organizationId);

  if (!organization || !organization.stripeAccountId) {
    return res.status(400).json({ error: 'Organization must set up a Stripe account before creating ticketing posts' });
  }

  next();
};
