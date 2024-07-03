const schedule = require('node-schedule');
const dayjs = require('dayjs');

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone');
const user = require('../models/user');
const postFeed = require('../models/postFeed');
const { default: axios } = require('axios');
const userPosts = require('../models/userPosts');
const settings = require('../models/settings');
const Posts = require('../models/postFeed');

dayjs.extend(utc)
dayjs.extend(timezone)


const fetchPosts = async (isRestarted = false) => {
    
    let lastFetchedAt = await settings.findOne({ identifier: 1 })
    let currentTime = new Date();
    if(!lastFetchedAt){
        // create one
        lastFetchedAt = await new settings({ identifier: 1, lastFetchedPosts: currentTime }).save();
    }

    let filter = {}
    if(!isRestarted){
        filter = { createdAt: { $gt: lastFetchedAt.lastFetchedPosts } }
    }
    // get posts
    let posts = await Posts.find({ 
        eventDate: {
            // Get posts for today
            $gte: dayjs().tz("America/Toronto").startOf('day').format('MM/DD/YYYY')
        },
        ...filter
    });

    console.log('posts', posts.length)
    
    await scheduleCustomJob(posts)
    // update last fetched at
    await settings.updateOne({
        identifier: 1
    }, {
        lastFetchedPosts: new Date()
    });

}



const scheduleCustomJob = async (posts) => {

    for(const post of posts){
        if(!post.eventDate || !post.eventTime) continue

        const date = post.eventDate 
        const time = post.eventTime

        let tornotoTime = dayjs().tz('America/Toronto');
        // set date
        tornotoTime = tornotoTime.set('date', parseInt(date.split('/')[1]));
        tornotoTime = tornotoTime.set('month', parseInt(date.split('/')[0] - 1));
        tornotoTime = tornotoTime.set('year', parseInt(date.split('/')[2]));
        // set time
        tornotoTime = tornotoTime.set('hour', parseInt(time.split(':')[0]));
        tornotoTime = tornotoTime.set('minute', parseInt(time.split(':')[1]));
        tornotoTime = tornotoTime.set('second', 0);

        // subtract 20 mins
        tornotoTime = tornotoTime.subtract(20, 'minute');

        //Convert the time to current machine timezone
        const newTime = tornotoTime.tz(dayjs.tz.guess());
        
        let hour = newTime.get('hour');
        let minute = newTime.get('minute');
        let day = newTime.get('date');
        let month = newTime.get('month'); //month - 1
        let year = newTime.get('year');
        
        const dated = new Date(year, month, day, hour, minute, 0);
      
        const job = schedule.scheduleJob(
            dated,
            async function (post) {
                await sendNotification(post._id.toString());
            }.bind(null, post));
    }

}


const sendNotification = async (postID) => {
    try {
        const userPost = await userPosts.find({ 
            postId: postID
        }).populate('userId', 'token notifications').populate('postId').lean();
        const post = userPost[0].postId;
        if(!post.verified) return;

        const tokens = []; 
        for(const user of userPost){
            if(user.userId.token && user.userId.notifications.includes('Saved Posts')){
                tokens.push(user.userId.token)
            }
        }
        // create 50 users chunk
        let usersChunk = [];
        let chunkSize = 50;
        for (let i = 0; i < tokens.length; i += chunkSize) {
            usersChunk.push(tokens.slice(i, i + chunkSize));
        }
       
        for(const users of usersChunk){
            let data = {
                "show_in_foreground": true,
                "data": {
                  "title": "Your Saved Post",
                  "body": `${post.title} is happening in 20 minutes`,
                  "data": {
                    post,
                    navigate: 'EventDetails'
                  },
                },
                "priority": "high",
                "notification": {
                    "title": "Your Saved Post",
                    "body": `${post.title} is happening in 20 minutes`,
                    "sound": "Enabled",
                    "show_in_foreground": true
                },
                "registration_ids": users
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

    } catch (err) {
        console.log('CRON JOB FAILED ==> ', err);
    }
}

const sendFreebieForecast = async () => {

    // setup cron job to run at utc 11:00 am mon-fri
    const rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = []; //1,2,3,4,5
    rule.hour = 11;
    rule.minute = 0;
    

    const job = schedule.scheduleJob(rule, async () => {
        const users = await user.find({ notifications: 'Freebies Forecast', token: { $ne:null }}).select('token').lean();

        // create 50 users chunk
        let usersChunk = [];
        let chunkSize = 50;
        for (let i = 0; i < users.length; i += chunkSize) {
            usersChunk.push(users.slice(i, i + chunkSize));
        }
    
        // send notification to each chunk
        await Promise.allSettled(
            usersChunk.map(async (users) => {
                return sendFreebieNotification(users.map(user => user.token));
            })
        )
    })
}

const sendFreebieNotification = async (users) => {
    try {
        let data = {
            "show_in_foreground": true,
            "data": {
                "title": "Freebie Forecast",
                "body": `Plan your breaks with today's freebies`,
                "data": {
                    navigate: 'ExploreScreen'
                },
            },
            "priority": "high",
            "notification": {
                "title": "Freebie Forecast",
                "body": `Plan your breaks with today's freebies`,
                "sound": "Enabled",
                "show_in_foreground": true
            },
            "registration_ids": users
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
     
    } catch (err) {
        console.log('Freebie notificaiotn error ==> ', err);
    }
}

module.exports = {
    scheduleCustomJob,
    //sendFreebieForecast,
    fetchPosts
}
