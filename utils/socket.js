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
            updateMessages = false;
            if(await Mongo.roomExists(data.roomname)){
                Mongo.addPlayer(data.roomname, user);
                updateMessages = true;
            }
            else{
                // First user to enter a room.
                Mongo.createRoom({
                    _id: data.roomname,
                    players: [user], // Array of players connected to the room.
                    words: await newGame(), // Initialize the board for the room.
                    messages: [], // Storage of chat messages for the room.
                })

            }

            // Joining the Socket Room.
            socket.join(data.roomname);
    
            // Creating new board in the room.
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getAllWordsInRoom(data.roomname))});
            
            // Update messages if necessary.
            if(updateMessages){
                // Clear all messages.
                io.to(data.roomname).emit('clear-messages');

                // Get messages from database.
                const messageArray = await Mongo.getAllMessages(data.roomname);
                console.log(messageArray);

                // Write each message.
                messageArray.forEach(function (messageObject) {
                    io.to(data.roomname).emit('chat', messageObject);
                });
            }

            // Emitting New Username to Clients.
            const messageObject = {
                username: data.username, 
                message: "", 
                event: "joined"
            };
            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);
    
            // Send online users array.
            io.to(data.roomname).emit('online-users', (await Mongo.getUsernamesInRoom(data.roomname)))
        })

        // Creating a new game.
        socket.on('new-game', async (data) => {
            const messageObject = {
                username: data.username, 
                message: "new game", 
                event: "new"
            };
            io.to(data.roomname).emit('chat', messageObject);
            await Mongo.updateAllWordsInRoom(data.roomname, await newGame());
            await Mongo.resetRoles(data.roomname);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getAllWordsInRoom(data.roomname))});
        })

        // Finding a word in the room.
        socket.on('find-word', async (data) => {
            const result = await Mongo.getWordInRoom(data.roomname,data.word);
            io.to(data.roomname).emit('found-word',{word: result});
        })

        // Update a word in the room to show.
        socket.on('show-word', async (data) => {
            await Mongo.updateWordInRoom(data.roomname, data.word);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getAllWordsInRoom(data.roomname))});
        })

        // Changing role to spymaster
        socket.on('role-change-spy', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, true);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getAllWordsInRoom(data.roomname))});
        })

        // Changing role to field operator
        socket.on('role-change-field', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, false);
            io.to(data.roomname).emit('board-game', {roles: (await Mongo.getRolesInRoom(data.roomname)), words: (await Mongo.getAllWordsInRoom(data.roomname))});
        })
    
        // Emitting messages to Clients.
        socket.on('chat', async (data) =>{
            const messageObject = {
                username: data.username, 
                message: data.message, 
                event: data.event
            };
            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);
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
                console.log("deleting room");
                Mongo.deleteRoom(roomname);
            } else {
                const username = await Mongo.removePlayerBySocketId(roomname, socketId);
                // Send disconnect message in chat
                const messageObject = {
                    username: username, 
                    message: "", 
                    event: "disconnected"
                };
                await Mongo.addMessage(roomname, messageObject);
                io.to(roomname).emit('chat', messageObject);
                
                // Send online users array.
                io.to(roomname).emit('online-users', (await Mongo.getUsernamesInRoom(roomname)))
            }
        })
    })
}

module.exports = socket;