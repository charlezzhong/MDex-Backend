//helpers
const { response } = require("../helpers/responseHandle");

//models
const Organization = require("../models/organization");
const Staff = require("../models/staff");
const Address = require("../models/address");
const Institution = require("../models/institution");
const postFeed = require("../models/postFeed");
const userPosts = require("../models/userPosts");
const Office = require("../models/office");

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
  if (!orgAddress) missingFields.push("Address");
  if (!orgOfficeRoomNumber) missingFields.push("Office Room Number");
  if (!orgOfficeOfficeBuilding) missingFields.push("Office Building");
  if (!orgWebsite) missingFields.push("Website");
  if (!jobTitle) missingFields.push("Job Title");

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
    let posts = await postFeed.find({ organization: orgId });
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


// Create an RSVP post
exports.createRSVP =  async (req, res) => {
  // TODO
};

// Get all the posts this organization has created
exports.getPosts = async (req, res) => {
  // TODO
};

// For a specific ticket, get all the users who have purchased it
exports.getUserTickets = async (req, res) => {
  // TODO
};