const { default: axios } = require("axios")
const User = require("../models/user")

const sendNotification = async (post) => {

    //get all users
    const users = await User.find({
        $and: [
            { 
                token: {
                    $exists: true
                }
            },
            {
                notifications: post.category
            }
        ]
    })
    let tokens = []
    for(let user of users) {
        tokens.push(user.token)
    }
    if(tokens.length == 0) return;
    
    // divide tokens into chunks of 50
    let chunks = []
    let chunkSize = 50
    let index = 0
    while(index < tokens.length) {
        chunks.push(tokens.slice(index, chunkSize + index))
        index += chunkSize
    }

    for(let chunk of chunks) {
        let data = {
            "show_in_foreground": true,
            "data": {
            "title": "New MDex Post",
            "body": `Free ${post.category} has dropped in the app`,
            "data": {
                post,
                navigate: 'EventDetails'
            },
            },
            "priority": "high",
            "notification": {
                "title": "New MDex Post",
                "body": `Free ${post.category} has dropped in the app`,  
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

module.exports = {
    sendNotification
}