const User = require("../models/user");
const PostFeed = require("../models/postFeed");
const UserPost = require("../models/userPosts");
const { hashPassword } = require("../helpers/auth");
const fs = require("fs");
const path = require("path");
const { moveFiles } = require("../helpers/fileMove");
const Notifications = require("../models/notifications");
const dayjs = require("dayjs");
const axios = require("axios");

exports.createUser = async (req, res) => {
    try {

        let { name, email, password, image } = req.body;

        const hashedPassword = await hashPassword(password);

        const user = await new User({
            name,
            email,
            password : hashedPassword,
            image,
            allow_notifications: true,
            notifications: ["Saved Posts", "Freebies Forecast"],
        }).save();

        let folderPath = path.join(__dirname, `../public/users/${user._id}`);


        fs.mkdir(folderPath, { recursive: true }, async (err) => {
            if (err) await User.findOneAndDelete({ _id: user._id });
        });

        let fileName = image.split("/").pop();

        moveFiles(folderPath, fileName);

        user.image = `media/users/${user._id}/${fileName}`;

        await user.save();

        res.json(user);

    }catch (err) {
        
        console.log(err);

        if(err.code === 11000) {
            return res.status(500).json({
                status: false,
                message: "Email already exists",
            });
        }

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.getUsers = async (req, res) => {
    try {

        const currentPage = req.query.pageNumber || 1;
        const perPage = req.query.limit || 3;
        let totalItems;
        let totalPages;

        // Get today's date and set time to the start of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get tomorrow's date and set time to the start of the day
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Count total new subscribers created today
        const totalNewUsersToday = await User.countDocuments({
            role: "Subscriber",
            createdAt: {
                $gte: today,
                $lt: tomorrow
            }
        });

        const users = await User.find()
            .countDocuments({role: "Subscriber"})
            .then((count) => {
                totalItems = count;
                totalPages = Math.ceil(totalItems / perPage);
                return User.find({role: "Subscriber"})
                    .skip((currentPage - 1) * perPage)
                    .sort({ createdAt: -1 })
                    .limit(perPage)
            })
            .then((users) => {
                res.status(200).json({users, totalItems, totalPages, totalNewUsersToday});
            })
            .catch((err) => {
                return res.status(500).json({
                    status: false,
                    message: err.message,
                });
            });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.getUser = async (req, res) => {
    try {

        const { userId } = req.params;

        const users = await User.find({
            _id: userId,
        });

        res.json(users);

    }catch (err) {
        
        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.updateUser = async (req, res) => {
    try {

        const { userId } = req.params;

        let { name, email, image, verified } = req.body;

        let folderPath = path.join(__dirname, `../public/users/${userId}`);

        fs.mkdir(folderPath, { recursive: true }, async (err) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: err.message,
                });
            } 
        });
        let fileName = "";
        if(image) {
            fileName = image.split("/").pop();
            moveFiles(folderPath, fileName);
            image = `media/users/${userId}/${fileName}`;
        }

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { name, email, image, verified },
            { new: true }
        );

        res.json(user);

    }catch (err) {
        
        console.log(err);

        if(err.code === 11000) {
            return res.status(500).json({
                status: false,
                message: "Email already exists",
            });
        }

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
}

exports.deleteUser = async (req, res) => {
    try {

        const { userId } = req.params;

        const deleteUserPost = await UserPost.deleteMany({ postedBy: userId });

        const user = await User.findOneAndDelete({ _id: userId });

        res.json(user);
        
    } catch (err) {

        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });
        
    }
}

exports.verifyUser = async (req, res) => {
    try {

        const { userId } = req.params;

        const user = await User.findOneAndUpdate(
            { _id: userId },
            { verified: true },
            { new: true }
        );

        res.json(user);

    }catch (err) {
        
        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
};

exports.verifyUserWithLink = async (req, res) => {
    try {

        const { userId, verificationCode } = req.params;

        const user = await User.findOneAndUpdate(
            { _id: userId, verificationCode },
            { verified: true },
            { new: true }
        );

        res.json({
            status : true,
            message : "User verified successfully"
        });

    }catch (err) {
        
        console.log(err);

        return res.status(500).json({
            status: false,
            message: err.message,
        });

    }
};

exports.updateNotification = async (req, res) => {
    const fs = require('fs');

    const {
        userId,
        notification,
        categories
    } = req.body;
    try {
        if(!userId) {
            return res.status(500).json({
                status: false,
                message: "User Id is required",
            });
        }
        const user = await User.findById(userId);
        if(!user){
            return res.status(500).json({
                status: false,
                message: "User not found",
            });
        }
        if(notification != undefined){
            user.allow_notifications = notification;
        }
        if(categories != undefined && Array.isArray(categories)){
            // check if notification category is valid
            const validCategories = ["Clothes", "Food", "Water Bottles", "Swag bag", "Phone Wallets", "Accessories", "Saved Posts", "Freebies Forecast", "Tickets", "Caffeine", "Pizza", "Snacks", "Therapy Dogs", "Hats"];
            let supportedCategories = [];
            for(let i = 0; i < categories.length; i++){
                if(validCategories.includes(categories[i])){
                    supportedCategories.push(categories[i]);
                }
            }
            console.log("supportedCategories", supportedCategories)
            user.notifications = supportedCategories;
        }
        await user.save();
        return res.status(200).json({
            status: true,
            message: "Notification updated successfully",
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            message: err.message,
        });
    }

}
exports.sendNotification = async (req, res) => {
    const {
        userId,
        title,
        body,
        message,
    } = req.body;

    if(!userId || !title || !body || !message) {
        return res.status(500).json({
            status: false,
            message: "Title, body and message are required",
        });
    }
    try {
        let user = await User.findById(userId)
        if(!user){
            return res.status(500).json({
                status: false,
                message: "User not found",
            });
        }
        if(user.role != "Admin"){
            return res.status(500).json({
                status: false,
                message: "Insufficient permission",
            });
        }
        // send notifications to all tokens 
        let tokens = [];
        let users = await User.find({
            $and: [
                {
                    token: { 
                        $exists: true,
                    },
                },
                {
                    "$or": [
                       {
                            allow_notifications: {
                               $eq: true,
                            }
                        },
                        {
                            allow_notifications: {
                                 $exists: false,
                            }
                        }
                    ]
                }
            ]
        });
        for(let i = 0; i < users.length; i++){
            tokens.push(users[i].token);
        }

        if(tokens.length != 0){
            // send notification in chunks of 50
            let chunks = [];
            let chunkSize = 50;
            let index = 0;
            while (index < tokens.length) {
                chunks.push(tokens.slice(index, chunkSize + index));
                index += chunkSize;
            }

            for(const chunk of chunks){
                let data = {
                    "show_in_foreground": true,
                    "data": {
                    "title": title,
                    "body": body,
                    "message": message,
                    },
                    "priority": "high",
                    "notification": {
                        "title": title,
                        "body": body,
                        "sound": "Enabled",
                        "show_in_foreground": true
                    },
                    "registration_ids": chunk
                };
                
                let config = {
                    method: 'post',
                    url: 'https://fcm.googleapis.com/fcm/send',
                    headers: { 
                        'Authorization': `key=${process.env.FCM_SERVER_KEY}`,  
                        'Content-Type': 'application/json'
                    },
                    data : data
                };
                
                await axios(config)
                .then(res => res.data)
                .catch(err => console.log(err))
            }
        }

        let noti = await new Notifications({
            title,
            body,
            message,
        }).save();


        return res.status(200).json({
            status: true,
            message: "Notification sent successfully",
            data: noti
        });

    }catch (err) {
        console.log(err);
        return res.status(500).json({
            status: false,
            message: err.message || "Something went wrong",
        });
    }
}

exports.getBannerNotifications = async (req, res) => {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const noti = await Notifications.findOne({
        createdAt: {
            $gte: oneHourAgo,
            $lt: new Date()
        }
    }).sort({ createdAt: -1 });

    return res.status(200).json({
        status: true,
        data: noti,
    })
}

exports.saveToken = async (req, res) => {
    const {
        userId,
        token,
    } = req.body;

    if(!userId || token == undefined) {
        return res.status(500).json({
            status: false,
            message: "Token is required",
        });
    }
    try {
        let user = await User.findById(userId)
        if(!user){
            return res.status(500).json({
                status: false,
                message: "User not found",
            });
        }
        user.token = token;
        await user.save();

        return res.status(200).json({
            status: true,
            message: "Token saved successfully",
        });

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message || "Something went wrong",
        });
    } 
}

exports.getNotificationToggles = async (req, res) => {

    const { 
        userId
    } = req.query;
    if(!userId) {
        return res.status(500).json({
            status: false,
            message: "User Id is required",
        });
    }
    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(500).json({
                status: false,
                message: "User not found",
            });
        }
        return res.status(200).json({
            status: true,
            allow_notifications: user.allow_notifications,
            notifications: user.notifications || [],
        });
        
    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message || "Something went wrong",
        });
    }
}
