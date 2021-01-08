const {getUsers, getRoles, users, Player, switchRoles, resetRoles} = require('./getUsers');
const {words, getWords, newGame} = require('./wordButton');

const {createRoom, deleteRoom} = require('../database/mongoDB');

// Socket connection.
function socket(io) {
    io.on('connection', (socket) => {

        socket.on('joined-user', (data) =>{ 
            // Storing users connected in a room in memory.
            var user = new Player(socket.id, data.username);
            console.log("hereeee")
            console.log(user)
            if(users[data.roomname]){
                users[data.roomname].push(user);
            }
            else{
                // First user to enter a room.
                users[data.roomname] = [user];
                createRoom({
                    _id: data.roomname,
                    players: [user]
                })
                // Initialize the board for the room.
                words[data.roomname] = newGame();
            }

            // Joining the Socket Room.
            socket.join(data.roomname);
    
            // Creating new board in the room.
            io.to(data.roomname).emit('board-game', {roles: getRoles(users[data.roomname]), words: getWords(words[data.roomname])})
            
            // Emitting New Username to Clients.
            io.to(data.roomname).emit('joined-user', {username: data.username});
    
            // Send online users array.
            io.to(data.roomname).emit('online-users', getUsers(users[data.roomname]))
        })

        // Creating a new game.
        socket.on('new-game', (data) => {
            words[data.roomname] = newGame();
            resetRoles(data.roomname);
            io.to(data.roomname).emit('board-game', {roles: getRoles(users[data.roomname]), words: getWords(words[data.roomname])})
        })

        // Changing roles.
        socket.on('role-change', (data) =>{
            switchRoles(data.username, data.roomname);
            console.log(getRoles(users[data.roomname]))
            io.to(data.roomname).emit('board-game', {roles: getRoles(users[data.roomname]), words: getWords(words[data.roomname])})
        })
    
        // Emitting messages to Clients.
        socket.on('chat', (data) =>{
            io.to(data.roomname).emit('chat', {username: data.username, message: data.message});
        })
    
        // Broadcasting the user who is typing.
        socket.on('typing', (data) => {
            socket.broadcast.to(data.roomname).emit('typing', data.username)
        })
    
        // Remove user from memory when they disconnect.
        socket.on('disconnecting', ()=>{
            console.log(socket.rooms)
            var rooms = Object.keys(socket.rooms);
            var socketId = rooms[0];
            var roomname = rooms[1];
            if (users.hasOwnProperty(roomname)){
                if (users[roomname].length == 1){
                    delete users[roomname];
                    deleteRoom(roomname);
                } else {
                    users[roomname].forEach((user, index) => {
                        if(user[socketId]){
                            users[roomname].splice(index, 1)
                        }
                    });
    
                    //Send online users array
                    io.to(roomname).emit('online-users', getUsers(users[roomname]))
                }
            }
            console.log("users")
            console.log(users)
        })
    })
}

module.exports = socket;