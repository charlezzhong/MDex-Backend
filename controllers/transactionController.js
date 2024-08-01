const { response } = require("../helpers/responseHandle")
const TicketPurchase = require("../models/ticketPurchase")
const Organization = require("../models/organization")
const QRCode = require('qrcode');
const Ticket = require("../models/ticket");

// Endpoint to handle organizations seting up card request
/*exports.setupCard = async (req, res) => {
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
};*/

// Function to generate QR code
const generateQRCode = async (text) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Failed to generate QR code', error);
    throw new Error('Failed to generate QR code');
  }
};

exports.purchase_ticket = async (req, res) => {
  const { ticketId, quantity } = req.body;
  const userId = req.userId;

  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Calculate application fee (20% of the ticket price)
    const applicationFeeAmount = Math.round(ticket.price * 0.20 * 100);

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: ticket.stripePriceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: 'https://your-frontend-url/success',
      cancel_url: 'https://your-frontend-url/cancel',

      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: stripeAccountId, // Specify the connected account ID here
        },
      },
    });

    // Wait for payment success (usually handled by a webhook, simplified here)
    // Assume payment success for simplicity
    const paymentIntentId = session.payment_intent;

    // Generate QR code
    const qrCode = await generateQRCode(`ticketPurchaseId:${paymentIntentId}`);

    // Create ticket purchase record
    const ticketPurchase = new TicketPurchase({
      user: userId,
      ticket: ticketId,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      quantity: quantity,
      qrCode: qrCode,
      used: false,
    });

    await ticketPurchase.save();

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Failed to process ticket purchase', error);
    res.status(500).json({ error: 'Failed to process ticket purchase' });
  }
};

exports.getqrcode = async (req, res) => {
  const ticketPurchaseId = req.params.id;
  const userId = req.userId;

  try {
    const ticketPurchase = await TicketPurchase.findById(ticketPurchaseId);
    if (!ticketPurchase || ticketPurchase.user.toString() !== userId) {
      return res.status(404).json({ error: 'Ticket purchase not found' });
    }

    res.json({ qrCode: ticketPurchase.qrCode });
  } catch (error) {
    console.error('Failed to fetch QR code', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
};

exports.validate_qr = async (req, res) => {
  const { qrCode } = req.body;

  try {
    const ticketPurchase = await TicketPurchase.findOne({ qrCode });

    if (!ticketPurchase) {
      return res.status(404).json({ valid: false, message: 'QR code not found' });
    }

    if (ticketPurchase.used) {
      return res.status(400).json({ valid: false, message: 'QR code already used' });
    }

    // Mark the QR code as used
    ticketPurchase.used = true;
    await ticketPurchase.save();

    res.json({ valid: true, ticketPurchase });
  } catch (err) {
    res.status(500).json({ error: 'Failed to validate QR code' });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const ticketPurchases = await TicketPurchase.find({ user: req.params.userId }).populate('ticket');
    res.json(ticketPurchases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket purchases' });
  }
};


