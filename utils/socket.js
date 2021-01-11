const newGame = require('./newgame');
const Mongo = require('../database/mongoDB');

// Socket connection.
function socket(io) {
    io.on('connection', (socket) => {

        socket.on('joined-user', async (data) =>{ 
            // Store connected user in database.
            var user = {
                socket: socket.id,
                username: data.username,
                show: false,
                team: "red",
            }
            if(await Mongo.roomExists(data.roomname)){
                Mongo.addPlayer(data.roomname, user);
            }
            else{
                // First user to enter a room.
                Mongo.createRoom({
                    _id: data.roomname,
                    players: [user], // Array of players connected to the room.
                    words: newGame(), // Initialize the board for the room.
                    messages: [], // Storage of chat messages for the room.
                })

            }

            // Joining the Socket Room.
            socket.join(data.roomname);
    
            // Creating new board in the room.
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getWords(data.roomname))})
            
            // Emitting New Username to Clients.
            io.to(data.roomname).emit('joined-user', {username: data.username});
    
            // Send online users array.
            io.to(data.roomname).emit('online-users', (await Mongo.getUsernamesInRoom(data.roomname)))
        })

        // Creating a new game.
        socket.on('new-game', async (data) => {
            await Mongo.updateWords(data.roomname, newGame());
            await Mongo.resetRoles(data.roomname); // untested
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getWords(data.roomname))})
        })

        // Changing role to spymaster
        socket.on('role-change-spy', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, true);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getWords(data.roomname))})
        })

        // Changing role to field operator
        socket.on('role-change-field', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, false);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getWords(data.roomname))})
        })
    
        // Emitting messages to Clients.
        socket.on('chat', (data) =>{
            io.to(data.roomname).emit('chat', {username: data.username, message: data.message, button: data.button});
        })
    
        // Broadcasting the user who is typing.
        socket.on('typing', (data) => {
            socket.broadcast.to(data.roomname).emit('typing', data.username)
        })
    
        // Remove user from memory when they disconnect.
        socket.on('disconnecting', async ()=>{
            console.log(socket.rooms)
            var rooms = Object.keys(socket.rooms);
            var socketId = rooms[0];
            var roomname = rooms[1];
            if ((await Mongo.getUsernamesInRoom(roomname)).length === 1){
                console.log("deleting")
                Mongo.deleteRoom(roomname);
            } else {
                Mongo.removePlayerBySocketId(roomname, socketId);
                //Send online users array
                io.to(roomname).emit('online-users', (await Mongo.getUsernamesInRoom(roomname)))
            }
        })
    })
}

module.exports = socket;