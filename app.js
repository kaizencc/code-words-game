const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io');
const Mongo = require('./database/mongoDB');
const alertMessage = require('./utils/messages');
const path = require('path');
const multer = require('multer');
var upload = multer({ dest: 'uploads/' });

var Filter = require('bad-words'),
filter = new Filter();

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
//app.use(favicon(path.join(__dirname,'favicon.ico')));
var port = process.env.PORT || 3000;

// Alert banner defaults to hidden
var alert = alertMessage.NONE;

// Render Index page
app.get('/', (req, res) => {
    res.render('index', {
        alert: alert,
    })
    alert = alertMessage.NONE;
})

// Middleware to validate room creation
app.use('/room', async function (req, res, next) {
    console.log("middleware");
    alert = alertMessage.NONE;
    const action = req.query.action;
    console.log(req.body.username, req.body.roomname);
    var username = req.body.username;
    var roomname = req.body.roomname;
    console.log(username, roomname)

    // Ensure that username and roomname has no profanity.
    if (username && username !== filter.clean(username)){
        alert = alertMessage.BAD_USERNAME;
        res.redirect('/');
        return;
    }
    if (roomname && roomname !== filter.clean(roomname)){
        alert = alertMessage.BAD_ROOMNAME;
        res.redirect('/');
        return;
    }

    console.log(username, roomname);
    const exists = await Mongo.roomExists(roomname, true);
    console.log("exists", exists);
    console.log("act", action);
    if (action == "create" && exists) {
        alert = alertMessage.CREATE_ALREADY_EXISTS;
        res.redirect('/');
        return;
    } else if (action == "join" && !exists) { 
        alert = alertMessage.JOIN_DOES_NOT_EXIST;
        res.redirect('/');
        return;
    } else if (action == "join" && (await Mongo.getUsersInRoom(roomname)).map(x => x.username).includes(username)){
        alert = alertMessage.JOIN_USERNAME_EXISTS;
        res.redirect('/');
        return;
    }
    next();
})

// Get username and roomname from form and pass it to room
app.post('/room', (req, res) => {
    console.log(req.route)
    roomname = req.body.roomname;
    username = req.body.username;
    res.redirect(`/room?username=${username}&roomname=${roomname}`)
})

app.post('/custom', upload.single('custom'), (req, res, next) => {
    const filename = req.file.originalname;
    const name = req.file.filename;

    console.log("HELLO", filename, name);
})

// Leaderboard
app.get('/leaderboard', async (req, res)=>{
    var leaderboard = await Mongo.getLeaderboard();
    leaderboard = processLeaderData(leaderboard);
    console.log(leaderboard);
    res.render('leaderboard', {
        board: leaderboard,
    });
})

/**
 * Process the dataset of players into one row each.
 * 
 * @param {{}} leaderboard Every player in the leaderboard.
 */
function processLeaderData(leaderboard){
    leaderboard.forEach(l => {
        // Encrypt id
        info = l._id.split("_");
        l._id = info[0] + " -- " + encrypt(info[1]);

        // Add win percentage
        if(l.losses > 0){
            percentage = l.wins / (l.wins + l.losses);
            l.winPercentage = Math.round((percentage + Number.EPSILON) * 100);
        } else if (l.wins > 0) {
            l.winPercentage = 100;
        } else {
            l.winPercentage = 0;
        }

        // Add correct percentage
        if(l.wrong > 0){
            percentage = l.correct / (l.correct + l.wrong);
            l.correctPercentage = Math.round((percentage + Number.EPSILON) * 100);
        } else if (l.correct > 0){
            l.correctPercentage = 100;
        } else {
            l.correctPercentage = 0;
        }

        // Add clue percentage + partner Percentage
        if(l.turns_sidekick > 0){
            percentage = l.clues / l.turns_sidekick;
            l.cluePercentage = Math.round((percentage + Number.EPSILON) * 100) / 100;

            percentage = l.partner_correct / l.turns_sidekick;
            l.partnerPercentage = Math.round((percentage + Number.EPSILON) * 100) / 100;
        } else {
            l.cluePercentage = 0;
            l.partnerPercentage = 0;
        }
    })
    return leaderboard;
}

function encrypt(str){
    return str.substring(0,3) + "#".repeat(str.length-3);
}

// Rules
app.get('/rules', (req, res) => {
    res.render('rules');
})

// Rooms
app.get('/room', (req, res)=>{
    res.render('room');
})

// Start Server
const server = app.listen(port, async () => {
    console.log(`Server Running on ${port}`)
    // Open Mongo Connection to populate the `client` and `db` variables in mongoDB.js.
    await Mongo.openMongoConnection();
})

const io = socket(server);
require('./utils/socket')(io);

// Close Mongo Connection when exiting program.
process.on('SIGINT', function() {
    Mongo.closeMongoConnection();
    process.exit();
  });


  