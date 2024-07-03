require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require('path');
const authRoutes = require("./routes/auth.js");
const morgan = require("morgan");
const socketIO = require('socket.io');
const app = express();
const http = require('http');
const CryptoJS = require("crypto-js");
const { fetchPosts, sendFreebieForecast } = require("./helpers/scheduler.js");
const rateLimit = require('./middleware/rateLimit');

const server = http.createServer(app);

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} has connected`);

  socket.on('disconnect', () => { 
    console.log("disconnected");
  });

  socket.on('error', function (err) {
    console.log(err);
  });

});

mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("DB connected");
    // schedulers
    fetchPosts(true);
    //sendFreebieForecast()

    // Start the server after successful database connection
    server.listen(8000, () => console.log("Server running on port 8000"));
  })
  .catch((err) => {
    console.log("DB CONNECTION ERROR: ", err);
    // Stop the server if there's an error connecting to the database
    process.exit(1);
  });

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("dev"));

app.use(rateLimit);

const secretKey = process.env.SECRET_KEY;

app.use((req, res, next) => {
  // decrypt body

  if (req.body && req.body.iv && req.body.data) {
    const iv = req.body.iv
    const encryptedData = req.body.data;
    console.log('request', encryptedData)
    try {
      let keys = CryptoJS.enc.Utf8.parse(secretKey);
      let base64 = CryptoJS.enc.Base64.parse(encryptedData);
      let src = CryptoJS.enc.Base64.stringify(base64);
      let decrypt = CryptoJS.AES.decrypt(src, keys, {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
      });
      let data = decrypt.toString(CryptoJS.enc.Utf8);
      req.body = JSON.parse(data);
      next();
    } catch (error) {
      console.error('Decryption error:', error);
      return res.status(500).json({ error: 'Decryption failed' });
    }
  } else {
    console.log('Skipping')
    next();
  }

  const encryptedResponse = (body) => {
    console.log('encryptedResponse', body)
    let orig = body;
    try {
      body = JSON.parse(body);
    }catch (err) {
      body = orig;
    }

    if (typeof body === 'object' && (!body.iv || !body.data)) {
      try {
        const responseBody = JSON.stringify(body);
        const iv = CryptoJS.lib.WordArray.random(64);

        const parsedkey = CryptoJS.enc.Utf8.parse(secretKey);
        const encrypted = CryptoJS.AES.encrypt(responseBody, parsedkey, {
          iv: iv,
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7,
        });

        return {
          data: encrypted.toString(),
          iv: iv.toString(),
        };        
      } catch (error) {
        return body
      }
    } else {
      return body
    }
  };

  res.json = function (body) {
    // if request url is /media skip encryption
    // if (req.url.includes('/media')) {
    //   return originalJson.call(res, body);
    // }
    res.setHeader('Content-Type', 'application/json');
    let data = body;
    if(req.originalUrl.includes('/ipa') && !data.data && !data.iv){
      data = encryptedResponse(body);
    }
    res.write(typeof data == "string" ? data : JSON.stringify(data));
    res.end();
  }
  res.send = function (body) {
    res.setHeader('Content-Type', 'application/json');
    let data = body;
    if(req.originalUrl.includes('/ipa')){
      data = encryptedResponse(body);
    }
    res.write(typeof data == "string" ? data : JSON.stringify(data));
    res.end();
  }
});
// Route middlewares
app.use("/api", authRoutes);  //without encryption
app.use('/ipa', authRoutes); // with encryption
// Error handling middleware
app.use((err, req, res, next) => {
  console.error("An error occurred:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.use("/media", express.static(path.join(__dirname, "public")));


global.ioInstance = io;