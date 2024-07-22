const express = require('express');

const app = express();
const cors = require('cors');

const orgRouter = require('./routes/organization');
const testRouter = require('./routes/test');
const feedbackRouter = require('./routes/feedbackRouter');
const postRouter = require('./routes/postRouter');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');

// Use middleware
app.use(express.json());
//app.use(express.static(`${__dirname}/public`));


// Enable CORS for all HTTP routes
app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Optionally specify which methods to allow
    allowedHeaders: ['Content-Type', 'Authorization'], // Optionally specify allowed headers
    credentials: true // Optional, but set to true if you need to support credentials
}));

//app.use('/ipa', testRouter);

//app.use('/api/v1/organization', orgRouter);
// POST endpoint to handle incoming data and save to the database
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

  app.use('/ipa/v2/testing', testRouter);

  app.use('/ipa/v2/organization', orgRouter);
  app.use('/ipa/v2/feedbackFeed', feedbackRouter);
  app.use('/ipa/v2/postFeed', postRouter);
  app.use('/ipa/v2/user', userRouter);
  app.use('/ipa/v2/admin', adminRouter);
  //app.use('/ipa/v2/postFeed', orgRouter);
  //app.use('/ipa/v2/postFeed', orgRouter);
  //app.use('/ipa/v2/postFeed', orgRouter);

module.exports = app;