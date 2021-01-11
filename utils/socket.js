const {getUsers, users, Player, switchRoles, resetRoles} = require('./getUsers'); // TO DELETE
const {words, getWords, newGame} = require('./wordButton');
const Mongo = require('../database/mongoDB');

// Socket connection.
function socket(io) {
    io.on('connection', (socket) => {

        socket.on('joined-user', async (data) =>{ 
            // Storing users connected in a room in memory.
            var user = {
                socket: socket.id,
                username: data.username,
                show: false,
                team: "red",
            }
                //new Player(socket.id, data.username);
            console.log("hereeee")
            console.log(user)
            const exists = await Mongo.roomExists(data.roomname);
            if(exists){
                // users[data.roomname].push(user); // TO DELETE
                Mongo.addPlayer(data.roomname, user)
            }
            else{
                // First user to enter a room.
                // users[data.roomname] = [user]; // TO DELETE
                Mongo.createRoom({
                    _id: data.roomname,
                    players: [user]
                })
                // Initialize the board for the room.
                words[data.roomname] = newGame();
            }

            // Joining the Socket Room.
            socket.join(data.roomname);
    
            // Creating new board in the room.
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: getWords(words[data.roomname])})
            
            // Emitting New Username to Clients.
            io.to(data.roomname).emit('joined-user', {username: data.username});
    
            // Send online users array.
            io.to(data.roomname).emit('online-users', (await Mongo.getUsernamesInRoom(data.roomname)))
        })

        // Creating a new game.
        socket.on('new-game', async (data) => {
            words[data.roomname] = newGame();
            resetRoles(data.roomname);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: getWords(words[data.roomname])})
        })

        // Changing role to spymaster
        socket.on('role-change-spy', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, true);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: getWords(words[data.roomname])})
        })

        // Changing role to field operator
        socket.on('role-change-field', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, false);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: getWords(words[data.roomname])})
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
        socket.on('disconnecting', async ()=>{
            console.log(socket.rooms)
            var rooms = Object.keys(socket.rooms);
            var socketId = rooms[0];
            var roomname = rooms[1];
            if ((await Mongo.getUsernamesInRoom(roomname)).length === 1){
                console.log("deletingn")
                //delete users[roomname]; // TO DELETE
                Mongo.deleteRoom(roomname);
            } else {
                Mongo.removePlayerBySocketId(roomname, socketId);
                // users[roomname].forEach((user, index) => {
                //     if(user.socket === socketId){
                //         //users[roomname].splice(index, 1) // TO DELETE
                //         Mongo.removePlayer(roomname, user)
                //     }
                // });

                //Send online users array
                io.to(roomname).emit('online-users', (await Mongo.getUsernamesInRoom(roomname)))
            }
        })
    })
}

module.exports = socket;