const jwt = require('jsonwebtoken');
const User =require('../models/user');

module.exports = async (req, res, next) => {
    let token = req.header("Authorization");
    //For now don't check token
    if(req.originalUrl.includes('/api')){
        return next()
    }

    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    try {
        // replace bearer
        token = token.replace('Bearer ', '')
        console.log('token', token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('decoded', decoded)
        const user = await User.findById(decoded._id);
        if (!user || user.role.toLowerCase() != 'admin') {
            return res.status(401).json({ error: "Not authenticated" });
        }

        req.user = user;
        next();
        
    }catch(err){
        console.log('err', err)
        return res.status(401).json({ error: "Not authenticated" });
    }
}