const User = require('../models/user');
const {hashPassword, comparePassword} = require('../helpers/auth');
const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const axios = require('axios');
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client();

// sendgrid
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const {sendEmail} = require('../helpers/email');
sgMail.setApiKey(process.env.SENDGRID_KEY);

exports.signup = async (req, res) => {
  console.log('Signup Hit');
  // validation
  const {name, email, password} = req.body;
  if (!name) {
    return res.status(400).json({
      error: 'Name is required',
    });
  }
  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
    });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({
      error: 'Password is required and should be 6 characters long',
    });
  }
  const domain = email.split('@')[1];
  if (domain !== 'umich.edu') {
    return res.status(400).json({
      error: 'Email must be from the @umich.edu domain',
    });
  }
  const exist = await User.findOne({email});
  if (exist) {
    return res.status(400).json({
      error: 'Email is taken',
    });
  }
  // hash password
  const hashedPassword = await hashPassword(password);

  const verificationCode = uuidv4().split('-')[0].toUpperCase();

  let userId;

  try {
    const user = await new User({
      name,
      email,
      password: hashedPassword,
      verificationCode,
      allow_notifications: true,
      notifications: ["Saved Posts", "Freebies Forecast"]
    }).save();

    userId = user._id;

    await sendEmail(
      user.email,
      'MDEX: Verify your email',
      `Welcome to MDex! 

We are super excited to have you join the MDex community! Please click on the link to verify your account. Once you verified your account, please return to the app and login!
Verfication Link: ${process.env.FORNTEND_HOST}/user/verify/${user._id}/${verificationCode}

If you have any questions, feel free to email us at hello@thisismdex.com. We will respond as quick as we can.

Best,

Your MDex Team`,
    );

    return res.json({
      message:
        'A verification link has been sent to your email. Please verify your account before logging in.',
    });
  } catch (err) {
    await User.deleteOne({_id: userId});

    console.log(err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
exports.signinGoogle = async (req, res) => {
  try {
    const  {
      idToken
    } = req.body
    const ticket = await client.verifyIdToken({
      idToken,
      audience: ['1096811347098-7lio780toquec8k7282ba20tinvkqb33.apps.googleusercontent.com', '1096811347098-c2ii5hh3l0bv8vu0fvgcq4pldcfglct7.apps.googleusercontent.com', '1096811347098-1mhpfdp94th2gqj26ujqe9dcuaqeo459.apps.googleusercontent.com'], // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    const email = payload["email"];
    const name = payload["name"];
    const domain = email.split('@')[1];
    if (domain !== 'umich.edu' && email !== 'mdex23testuser@gmail.com') {
      return res.status(200).json({
        error: 'Email must be from the @umich.edu domain',
      });
    }
    // check user
    let user = await User.findOne({ email });
    if (!user) {
      user = await new User({
        name,
        email,
        password: uuidv4(),
        verificationCode: null,
        verified: true,
        allow_notifications: true,
        notifications: ["Saved Posts", "Freebies Forecast"]
      }).save();
      await sendEmail(
        email,
        'MDEX: Welcome to MDex!',
        `Welcome to MDex! 
  
We are super excited to have you join the MDex community! Our team is working hard over the summer for the Fall 2024 release. Stay tuned for that! 
  
If you have any questions, feel free to email us at hello@thisismdex.com. We will respond as quick as we can.
  
Best,
  
Your MDex Team`,
      );
  
    }
    // create signed token
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    user.password = undefined;
    return res.json({
      token,
      user,
    });

  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
};

exports.signin = async (req, res) => {
  try {
    const {email, password} = req.body;
    // check if our db has user with that email
    const user = await User.findOne({email});
    if (!user) {
      return res.json({
        error: 'No user found',
      });
    }

    if (!user.verified) {
      return res.json({
        error: "Please can't login please verify your account",
      });
    }

    // check password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: 'Wrong password',
      });
    }
    // create signed token
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    user.password = undefined;
    user.secret = undefined;
    res.json({
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send('Error. Try again.');
  }
};

exports.forgotPassword = async (req, res) => {
  const {email} = req.body;
  // find user by email
  const user = await User.findOne({email});
  if (!user) {
    return res.json({error: 'User not found'});
  }
  // generate code
  const resetCode = uuidv4().split('-')[0].toUpperCase();
  // save to db
  user.resetCode = resetCode;
  user.save();
  // prepare email
  const emailData = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Password reset code',
    html: `<h1>Your password reset code is: ${resetCode}</h1>`,
  };
  // send email
  try {
    const data = await sgMail.send(emailData);
    console.log(data);
    res.json({ok: true});
  } catch (err) {
    console.log(err);
    res.json({ok: false});
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const {email, password, resetCode} = req.body;
    // find user based on email and resetCode
    const user = await User.findOne({email, resetCode});
    // if user not found
    if (!user) {
      return res.json({error: 'Email or reset code is invalid'});
    }
    // if password is short
    if (!password || password.length < 6) {
      return res.json({
        error: 'Password is required and should be 6 characters long',
      });
    }
    // hash password
    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.resetCode = '';
    user.save();
    return res.json({ok: true});
  } catch (err) {
    console.log(err);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const {email, currentPassword, newPassword} = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.json({
        error: 'Please provide current password and new password',
      });
    }
    if (currentPassword == newPassword) {
      return res.json({
        error: 'Current password and new password cannot be same',
      });
    }

    const user = await User.findOne({email});
    // if user not found
    if (!user) {
      return res.json({error: 'User not found'});
    }

    const match = await comparePassword(currentPassword, user.password);
    if (!match) {
      return res.json({
        error: 'Current password is wrong',
      });
    }

    //reset the password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return res.json({
      message: 'Password changed successfully',
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
};
