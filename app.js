const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io');
const {getRooms, users, getUsers} = require('./utils/getUsers'); // TO DELETE
const Mongo = require('./database/mongoDB');
const {alertMessage} = require('./utils/messages');

const {openMongoConnection, closeMongoConnection} = require('./database/mongoDB');

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
var port = process.env.PORT || 3000;

// Alert banner defaults to hidden
var alert = alertMessage.NONE;

// Render Index page
app.get('/', (req, res) => {
    res.render('index', {
        alert: alert
    })
    alert = alertMessage.NONE
})

// Middleware to validate room creation
app.use('/room', async function (req, res, next) {
    alert = alertMessage.NONE;
    const action = req.query.action;
    const username = req.body.username;
    const roomname = req.body.roomname;
    const exists = await Mongo.roomExists(roomname);
    console.log(exists);
    console.log(action);
    if (action == "create" && exists) {
        alert = alertMessage.CREATE_ALREADY_EXISTS;
        res.redirect('/');
        return;
    } else if (action == "join" && !exists) { 
        alert = alertMessage.JOIN_DOES_NOT_EXIST;
        res.redirect('/');
        return;
    } else if (action == "join" && (await Mongo.getPlayersInRoom(roomname)).includes(username)){
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

//Rooms
app.get('/room', (req, res)=>{
    res.render('room')
})

// Open Mongo Connection to populate the `client` and `db` variables in mongoDB.js.
openMongoConnection();

// Start Server
const server = app.listen(port, () => {
    console.log(`Server Running on ${port}`)
})

const io = socket(server);
require('./utils/socket')(io);

// Close Mongo Connection when exiting program.
process.on('SIGINT', function() {
    closeMongoConnection();
    process.exit();
  });


  