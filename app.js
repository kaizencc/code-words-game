const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io')
const {rooms} = require('./utils/roomStorage');


const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
var port = process.env.PORT || 3000;

// Render Index page
app.get('/', (req, res) => {
    res.render('index')
})

// Middleware to validate room creation
app.use('/room',function (req, res, next) {
    console.log(req.query.action)
    if (req.query.action) {
        if (req.query.action == "create") {
            if (rooms.has(req.body.roomname)){
                console.log('invalid') // must error out 
                return
            } else {
                rooms.add(req.body.roomname)
            }
        } else 
        if (req.query.action == "join" && !rooms.has(req.body.roomname)) {
            console.log("invalid")
            return
        }
    } 
    next()
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

//Start Server
const server = app.listen(port, () => {
    console.log(`Server Running on ${port}`)
})

const io = socket(server);
require('./utils/socket')(io);