const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const dotenv = require('dotenv');
const mongoose = require('mongoose');
//models
const Organization = require("./models/organization");


const app = express();
const port = 3000;


// connect to the database
dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace('<PASSWORD>',
    process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(con => {
    console.log(con.connections);
    console.log('DB connection successful');
})

// Ann Arbor boundary
const annArborBoundary = {
    north: 42.350,
    south: 42.230,
    east: -83.650,
    west: -83.800
};

// Central Campus boundary
const centralCampusBoundary = {
    north: 42.280,
    south: 42.270,
    east: -83.735,
    west: -83.750
  };
  
  // North Campus boundary
  const northCampusBoundary = {
    north: 42.300,
    south: 42.290,
    east: -83.710,
    west: -83.720
  };

const centralCampusPolygon = [
    [
        -83.74352615586291,
        42.28785551765736
      ],
      [
        -83.76763529438612,
        42.273813584406184
      ],
      [
        -83.73266424295376,
        42.255242205573666
      ],
      [
        -83.69994534844825,
        42.256341885522744
      ],
      [
        -83.70057835288658,
        42.27755514534695
      ],
      [
        -83.74352615586291,
        42.28785551765736
      ]
]

const northCampusPolygon = [
    [
        -83.74321323974648,
        42.287953426852056
      ],
      [
        -83.70050269923767,
        42.27755083313218
      ],
      [
        -83.68755847837234,
        42.2792539024895
      ],
      [
        -83.69388666285585,
        42.30439265689532
      ],
      [
        -83.72572885651279,
        42.30498086248511
      ],
      [
        -83.74321323974648,
        42.287953426852056
      ]
]
  
app.use(cors());
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// GET endpoint


// POST endpoint to handle incoming data and save to the database
app.post('/api/data', async (req, res) => {
    const data = req.body;
    try {
      const organization = new Organization(data);
      const savedOrganization = await organization.save();
      res.status(201).json({ message: 'Organization created successfully', organization: savedOrganization });
    } catch (error) {
      res.status(400).json({ message: 'Error creating organization', error });
    }
  });

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});