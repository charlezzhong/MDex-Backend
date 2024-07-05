const express = require('express');
const bodyParser = require('body-parser');
const inside = require('point-in-polygon');
const cors = require("cors");

const app = express();
const port = 3000;

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

// Helper function to check if coordinates are within a given boundary
const isWithinBoundary = (lat, lng, boundary) => {
    return (
      lat <= boundary.north &&
      lat >= boundary.south &&
      lng <= boundary.east &&
      lng >= boundary.west
    );
  };

// Function to determine the campus
/*const determineCampus = (lat, lng) => {
    if (isWithinBoundary(lat, lng, centralCampusBoundary)) {
      return "Central Campus";
    } else if (isWithinBoundary(lat, lng, northCampusBoundary)) {
      return "North Campus";
    } else {
      return "Not in Central or North Campus";
    }
  };*/

// Function to determine the campus
const determineCampus = (lat, lng) => {
    const point = [lng, lat];
    if (inside(point, centralCampusPolygon)) {
      return "Central Campus";
    } else if (inside(point, northCampusPolygon)) {
      return "North Campus";
    } else {
      return "Not in Central or North Campus";
    }
  };

// GET endpoint
app.get('/api/data', (req, res) => {
    const { lat, lng } = req.query;
  
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
  
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
  
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: 'Invalid latitude or longitude' });
    }
  
    const isWithin = isWithinBoundary(latitude, longitude, annArborBoundary);
    const campus = determineCampus(latitude, longitude);
    
    
    res.json({ 
      latitude, 
      longitude, 
      isWithinAnnArbor: isWithin,
      campus
    });
  });

// POST endpoint
app.post('/api/data', (req, res) => {
  const data = req.body;
  res.json({ message: 'POST request received', receivedData: data });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});