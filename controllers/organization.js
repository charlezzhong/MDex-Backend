//helpers
const { response } = require("../helpers/responseHandle");

//models
const Organization = require("../models/organization");
const Staff = require("../models/staff");
const Address = require("../models/address");
const Institution = require("../models/institution");
const PostFeed = require("../models/postFeed");
const userPosts = require("../models/userPosts");
const Office = require("../models/office");
const Restaurant = require("../models/restaurant");
const { statusValue } = require("../helpers/enums");


/*
    @Route GET : Fetch organization by email
    Query -> email : emailAddress of the user to find the org from staff or directly from org collection
*/
exports.getOrganizationByEmail = async (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res.json({
      error: "Email is required",
    });
  }

  try {
    //check if user exist as organization or staff
    const staff = await Staff.findOne({ email: email })
      .populate("office")
      .populate({
        path: "organization",
        populate: {
          path: "office",
          model: "Office",
        },
      });

    const organization = await Organization.findOne({ orgEmail: email })
      .populate("orgAddress")
      .populate("office");
    if (organization) {
      return response(200, "Organization found", { organization, staff }, res);
    }

    //check if user exist as staff and link to organization

    if (staff) {
      return response(
        200,
        "Organization found",
        { organization: null, staff },
        res
      );
    }

    //if user is not linked to any organization return 404
    return response(404, "Organization not found", null, res);
  } catch (err) {
    console.log(err, "err");
    return response(500, err.message || "Internal Server Error", null, res);
  }
};

exports.find_restaurant_by_email = async (req, res) => {
  let { email } = req.body;

  if (!email) {
    return res.json({
      error: "Email is required",
    });
  }

  try {
    // Find the restaurant by orgEmail
    const restaurant = await Restaurant.findOne({ orgEmail: email });
    console.log("you find it or no?");

    if (!restaurant) {
      return res.json({
        error: "Restaurant not found",
      });
    }
    console.log("find!!!");

    // Return the found restaurant
    //res.status(201).json({ message: 'Organization found successfully', organization: restaurant });
    return res.status(200).json({ 
      message: "Organization found successfully", 
      organization: { organization: restaurant }
    });
    /*return res.json({
      success: true,
      data: restaurant,
    });*/
  } catch (error) {
    console.error("Error finding restaurant:", error);
    return res.json({
      error: "An error occurred while trying to find the restaurant",
    });
  }
};

exports.createRestaurant = async (req, res) => {
  console.log(req.body);
  try {
    const {
      name,
      address,
      postalCode,
      city,
      country,
      phoneNumber,
      storeType,
      email,
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }
    console.log("wiwiwi");
    console.log(name);
    console.log(email);

    /*const existingRestaurant = await Restaurant.findOne({ orgEmail: email });
    console.log(existingRestaurant);
    if (existingRestaurant) {
      return res.status(200).json({ message: 'Restaurant already exists.', data: null });
    }*/

    // Create a new restaurant object
    const newRestaurant = new Restaurant({
      orgName: name,
      /*restAddress: {
        address,
        postalCode,
        city,
        country,
      },*/
      orgAddress: address,
      orgPhone: phoneNumber,
      //storeType,
      orgEmail: email,
      email: email,
      status: statusValue.approved
    });
    console.log("create?")

    // Save the new restaurant to the database
    await newRestaurant.save();

    // Respond with the created restaurant
    //return res.status(201).json(newRestaurant);
    //return response(200, "Success", { newRestaurant }, res);
    res.status(201).json({ message: 'Organization created successfully', organization: newRestaurant });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error code
      console.log("duplicate create");
      return res.status(200).json({ message: 'Restaurant already exists.', data: null });
    }
    console.error('Error creating restaurant:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


// Create organization
// @route Post /api/organization/create
// @desc Create organization
exports.createOrganization = async (req, res) => {
  let body = req.body;
  let {
    orgName,
    orgWebsite,
    orgEmail,
    email,
    orgAddress,
    orgOfficeRoomNumber,
    orgOfficeOfficeBuilding,
    jobTitle,
    role,
  } = req.body;

  const filePath = req.picture;
  console.log(req.body, "req.body");
  const missingFields = [];
  if (!email) missingFields.push("Email");
  if (!orgName) missingFields.push("Name");
  //if (!orgAddress) missingFields.push("Address");
  //if (!orgOfficeRoomNumber) missingFields.push("Office Room Number");
  //if (!orgOfficeOfficeBuilding) missingFields.push("Office Building");
  //if (!orgWebsite) missingFields.push("Website");
  //if (!jobTitle) missingFields.push("Job Title");

  if (missingFields.length > 0) {
    const errorMessage =
      "The following fields are required: " + missingFields.join(", ");
    return response(400, errorMessage, null, res);
  }

  try {
    // create address
    let addressData = {
      mapbox_id: orgAddress?.map_id || "",
      addressLine1: orgAddress?.addressLine1,
      city: orgAddress?.city || "",
      state: orgAddress?.state || "",
      postalCode: orgAddress?.postalCode || "",
      country: orgAddress?.country || "",
    };
    let addressResp = await Address.create(addressData);
    let officeId = "";
    if (orgOfficeRoomNumber || orgOfficeOfficeBuilding) {
      //create and office
      let officeData = await Office.create({
        officeBuilding: orgOfficeOfficeBuilding,
        roomNumber: orgOfficeRoomNumber,
      });
      officeId = officeData._id;
    }

    let data = {
      orgName: orgName,
      orgEmail: orgEmail,
      email: email,
      orgLogo: filePath || "",
      orgOffice: officeId,
      orgWebsite: orgWebsite,
      orgAddress: addressResp._id,
      role: "ADMIN",
    };
    if (orgOfficeRoomNumber || orgOfficeOfficeBuilding) {
      data.office = officeId;
    }
    //create organization and link to address
    const organization = await Organization.create(data);

    //create a Admin staff
    let dataForStaff = {
      organization: [organization._id],
      address: addressResp._id,
      name: body.username,
      image: body.userimage,
      email: orgEmail,
      jobTitle,
      role: "ADMIN",
    };

    let dataForInst = {
      institutionName: orgName,
      address: addressResp._id,
    };
    await Institution.create(dataForInst);
    const staffData = await Staff.create(dataForStaff);
    return response(200, "Success", { organization, staff: staffData }, res);
  } catch (err) {
    console.log(err);
    return response(500, err?._message || "Internal Server Error", null, res);
  }
};

exports.createOrganization1 = async (req, res) => {
  const data = req.body;
  try {
    const organization = new Organization(data);
    const savedOrganization = await organization.save();
    res.status(201).json({ message: 'Organization created successfully', organization: savedOrganization });
  } catch (error) {
    res.status(400).json({ message: 'Error creating organization', error });
  }
};
/*
exports.updateOrganization = async (req, res) => {
  let body = req.body;
  const { orgId } = req.params;

  if (!body) {
    return response(400, "All fields are required", null, res);
  }

  let org = await Organization.findById(orgId).populate("office").exec();
  if (req.pictures) {
    let oldMedia = body?.media || [];
    let media = [...oldMedia, ...req.pictures];
    body.media = media;
  }
  if (!org) {
    return response(404, "Invalid organization id provided", null, res);
  }

  //checking if the email already exist for the organization
  if (body?.orgEmail) {
    let isEmailExist = await Organization.findOne({ orgEmail: body?.orgEmail });
    if (isEmailExist && isEmailExist._id == orgId) {
      return response(400, "Email already in use", null, res);
    }
  }

  //update an organization office info or create if not exist
  if (body?.office) {
    console.log(body?.office);
    if (
      body?.office?.officeBuilding ||
      body?.office?.roomNumber ||
      body?.office?.hours
    ) {
      if (org) {
        if (!org.office) {
          let officeData = await Office.create(body.office);
          body.office = officeData?._id;
        } else {
          await Office.findOneAndUpdate({ _id: org.office }, body?.office, {
            new: true,
          });
          delete body.office;
          // body.office = officeData?._id
        }
      }
    }
  }

  try {
    const orgResponse = await Organization.findByIdAndUpdate(orgId, body, {
      new: true,
    }).populate("office");
    return response(200, "Organization updated successfully", orgResponse, res);
  } catch (error) {
    let msg = error?.message || "Something went wrong";
    return response(500, msg, error, res);
  }
};

exports.getAnalytics = async (req, res) => {
  const { orgId } = req.params;

  try {
    let analytics = {
      totalPosts: 0,
      totalSaves: 0,
      inReviewPosts: 0,
    };
    let posts = await PostFeed.find({ organization: orgId });
    if (posts.length) {
      let ids = posts.map((post) => post._id);
      let totalSaves = await userPosts.find({ postId: { $in: ids } }).count();
      analytics.totalPosts = posts.length;
      analytics.totalSaves = totalSaves;
    }
    return response(200, "success", analytics, res);
  } catch (error) {
    let msg = error?.message || "Something went wrong";
    return response(500, msg, error, res);
  }
};

// Create a Stripe price object and create a ticketing post
exports.createTicketing =  async (req, res) => {
  const { organizationId, title, description, ticketPrice, currency } = req.body;

  try {
    const organization = await Organization.findById(organizationId);
    const stripeAccountId = organization.stripeAccountId;

    // Create a price object in Stripe
    const price = await stripe.prices.create({
      unit_amount: ticketPrice * 100, // amount in cents
      currency: currency || 'usd',
      product_data: {
        name: title,
        description,
      },
      transfer_data: {
        destination: stripeAccountId,
      },
    });

    // Create a new post in your database with the price ID
    const post = new Post({
      organizationId,
      title,
      description,
      ticketPrice,
      currency: currency || 'usd',
      stripePriceId: price.id, // Store the Stripe price ID
    });

    await post.save();

    res.status(201).json({ message: 'Post created successfully', post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

exports.createTicketing = async (req, res) => {
  const { title, description, date, ticketInfo, organizationId, eventLocation, eventLocationDescription, eventDate, eventTime, eventEndTime, image, postedBy, category, campus } = req.body;

  try {
    // Create ticketing details
    const ticketing = new Ticketing({
      price: ticketInfo.price,
      currency: ticketInfo.currency,
      stripeProductId: ticketInfo.stripeProductId,
      stripePriceId: ticketInfo.stripePriceId,
      availableTickets: ticketInfo.availableTickets,
      event: null, // Will be updated after creating the event
    });

    // Create new event
    const newEvent = new PostFeed({
      title,
      description,
      eventDate,
      eventTime,
      eventEndTime,
      eventLocation,
      eventLocationDescription,
      image,
      postedBy,
      category,
      campus,
      eventType: 'Ticketing',
      ticketing: ticketing._id, // Reference to the ticketing document
      organization: organizationId
    });

    // Save event to the database
    const savedEvent = await newEvent.save();

    // Update ticketing with the event ID
    ticketing.event = savedEvent._id;
    await ticketing.save();

    res.status(201).json({ message: 'Ticketing event created successfully', event: savedEvent });
  } catch (error) {
    console.error('Error creating ticketing event:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}


// Create an RSVP post
exports.createRSVP =  async (req, res) => {
  // TODO
  const { title, description, eventDate, eventTime, eventEndTime, eventLocation, eventLocationDescription, image, postedBy, category, campus, rsvpLink, maxAttendees, organizationId } = req.body;

  try {
    // Create RSVP details
    const rsvp = new Rsvp({
      rsvpLink,
      maxAttendees,
      currentAttendees: 0,
      event: null, // Will be updated after creating the event
    });

    // Create new event
    const newEvent = new PostFeed({
      title,
      description,
      eventDate,
      eventTime,
      eventEndTime,
      eventLocation,
      eventLocationDescription,
      image,
      postedBy,
      category,
      campus,
      eventType: 'RSVP',
      rsvp: rsvp._id, // Reference to the RSVP document
      organization: organizationId
    });

    // Save event to the database
    const savedEvent = await newEvent.save();

    // Update RSVP with the event ID
    rsvp.event = savedEvent._id;
    await rsvp.save();

    res.status(201).json({ message: 'RSVP event created successfully', event: savedEvent });
  } catch (error) {
    console.error('Error creating RSVP event:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all the posts this organization has created
exports.getPosts = async (req, res) => {
  // TODO
  const organizationId = req.user._id;

  try {
    // Fetch events created by the organization
    const events = await PostFeed.find({ createdBy: organizationId });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching organization posts:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// For a specific ticket, get all the users who have purchased it
exports.getUserTickets = async (req, res) => {
  // TODO
  const { eventId } = req.query;
  const organizationId = req.user._id;

  try {
    // Verify if the event belongs to the organization
    const event = await Event.findOne({ _id: eventId, createdBy: organizationId });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or not authorized' });
    }

    // Fetch ticket purchases for the event
    const ticketPurchases = await TicketPurchase.find({ eventId })
      .populate('userId', 'name email'); // Populating user details

    res.status(200).json(ticketPurchases);
  } catch (error) {
    console.error('Error fetching ticket purchases:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getUserRSVPs = async (req, res) => {
  const { eventId } = req.query; // Assuming eventId is passed as a query parameter

  try {
    // Find all RSVP entries for the specific event
    const rsvps = await RSVP.find({ eventId }).populate('userId', 'name email'); // Adjust as per your schema fields

    res.status(200).json(rsvps);
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.createOrganization1 = async (req, res) => {
  const data = req.body;
  try {
    const organization = new Organization(data);
    const savedOrganization = await organization.save();
    res.status(201).json({ message: 'Organization created successfully', organization: savedOrganization });
  } catch (error) {
    res.status(400).json({ message: 'Error creating organization', error });
  }
};

// Refactor to user later
exports.UserGetPurchased = async (req, res) => {
  const userId = req.user.id; // Assuming req.user is set after authentication

  try {
    // Find all ticket purchases by the user
    const purchases = await TicketPurchase.find({ userId }).populate('eventId');

    res.status(200).json(purchases);
  } catch (error) {
    console.error('Error fetching purchased tickets:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}

// Refactor to user later
exports.UserGetRSVP = async (req, res) => {
  const userId = req.user.id; // Assuming req.user is set after authentication

  try {
    // Find all RSVP events by the user
    const rsvpEvents = await RSVP.find({ userId }).populate('event');

    res.status(200).json(rsvpEvents);
  } catch (error) {
    console.error('Error fetching RSVP events:', error);
    res.status(500).json({ message: 'Server error', error });
  }
}
*/



/*app.post('/api/', async (req, res) => {
  const data = req.body;
  try {
    const organization = new Organization(data);
    const savedOrganization = await organization.save();
    res.status(201).json({ message: 'Organization created successfully', organization: savedOrganization });
  } catch (error) {
    res.status(400).json({ message: 'Error creating organization', error });
  }
});*/