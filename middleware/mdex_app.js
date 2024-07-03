/*const express = require('express');
const rateLimit = require('./rateLimit');
const authMiddleware = require('./jwt');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
// Import other middleware helpers as needed

const app = express();

// Apply middleware globally or to specific routes
// 1. Use Helmet middleware
app.use(helmet());

// 2. CORS Middleware
app.use(cors());

// 3. Compression Middleware
app.use(compression());


app.use(rateLimit);
app.use(authMiddleware);
// Use other middleware as needed

module.exports = app;*/