
// add jwt middleware
// Path: middleware/jwt.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async (req, res, next) => {
    // Get token from header
    let token = req.header("Authorization");

    // Check if not token
    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify token
    try {
        // Remove 'Bearer ' from token string if present
        token = token.replace('Bearer ', '');

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if token expiration is approaching (within 3 months)
        const now = Date.now() / 1000; // Current time in seconds
        const expirationThreshold = now + (3 * 30 * 24 * 60 * 60); // 3 months in seconds

        if (decoded.exp < expirationThreshold) {
            // Token is within the 3-month validity period, refresh token
            const refreshedToken = jwt.sign({ _id: decoded._id }, process.env.JWT_SECRET, { expiresIn: '3 months' });
            res.setHeader('Authorization', 'Bearer ' + refreshedToken);
        }

        // Fetch user details from database
        let user = await User.findById(decoded._id);

        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Attach user object to request
        req.user = user;
        next();
    } catch (e) {
        console.error('JWT Verification Error:', e);
        return res.status(401).json({ error: "Not authenticated" });
    }
}
/*module.exports = async (req, res, next) => {
    // Get token from header
    //For now don't check token
    return next()
    if(req.originalUrl.includes('/api')){
        return next()
    }
    let token = req.header("Authorization");
    console.log('token', token)
    console.log('=================')
    // Check if not token
    if (!token) {
        console.log('no token')
        return res.status(401).json({ error: "Not authenticated" });
    }
    // Verify token
    try {
        token = token.replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded', decoded)
        let user = await User.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        req.user = user;
        next();
    } catch (e) {
        console.log('err', e)
        return res.status(401).json({ error: "Not authenticated" });
    }
}*/