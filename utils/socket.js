const {newGame} = require('./newgame');
const Mongo = require('../database/mongoDB');

function randomTeam(){
    if (Math.floor(Math.random() * 2) === 0){
        return "red";
    } else {
        return "blue";
    }
}

// Socket connection.
function socket(io) {
    io.on('connection', (socket) => {

        socket.on('joined-user', async (data) =>{ 
            // Store connected user in database.
            var user = {
                socket: socket.id,
                username: data.username,
                show: false,
                team: randomTeam(),
            }
            firstPlayer = true;
            if(await Mongo.roomExists(data.roomname)){
                Mongo.addPlayer(data.roomname, user);
                firstPlayer = false;
            }
            else{
                // First user to enter a room.
                Mongo.createRoom({
                    _id: data.roomname,
                    players: [user], // Array of players connected to the room.
                    words: await newGame(), // Initialize the board for the room.
                    messages: [], // Storage of chat messages for the room.
                    currentTurn: "red-spy",
                })

            }

            // Joining the Socket Room.
            socket.join(data.roomname);
    
            // Creating new board in the room.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                scoreReset: firstPlayer,
            });
            
            // Update messages if necessary.
            if(!firstPlayer){
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

            // If not a refresh, will send join message.
            io.to(data.roomname).emit('check-refresh', {
                username: data.username, 
                roomname: data.roomname
            });
    
            // Send online users array.
            io.to(data.roomname).emit('online-users', (await Mongo.getUsersInRoom(data.roomname)))
        })

        socket.on('join-message', async (data) => {
            // Emitting New Username to Clients.
            const messageObject = {
                username: data.username, 
                message: "", 
                event: "joined"
            };
            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);
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
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                scoreReset: true,
            });
            io.to(data.roomname).emit('reset-display', {});
        })

        socket.on('help', async (data) => {
            const username = await Mongo.getUsernameOfRedSpymaster(data.roomname);
            console.log(username);
        })

        // Finding a word in the room.
        socket.on('find-word', async (data) => {
            const result = await Mongo.getWordInRoom(data.roomname,data.word);
            io.to(data.roomname).emit('found-word',{data: result});
        })

        // Update a word in the room to show.
        socket.on('show-word', async (data) => {
            await Mongo.updateWordInRoom(data.roomname, data.word);
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                scoreReset: false,
            });
        })

        // Change a users team.
        socket.on('change-teams', async (data) => {
            await Mongo.changeTeams(data.username, data.roomname, data.team);
        })

        socket.on('move-user', (data) => {
            io.to(data.roomname).emit('move-user', {
                elementId: data.elementId,
                username: data.username,
                team: data.team,
            })
        })

        // Changing role to spymaster.
        socket.on('role-change-spy', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, true);
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                scoreReset: false,
            });
        })

        // Changing role to field operator.
        socket.on('role-change-field', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, false);
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                scoreReset: false,
            });
        })

        // Ending the game.
        socket.on('game-over', async (data) => {
            // Call board game first to update html.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                scoreReset: false,
                gameover: true,
            });
            // Upon closing the game over screen, reverts back to previous html.
            io.to(data.roomname).emit('game-over');
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
            var rooms = Object.keys(socket.rooms);
            var socketId = rooms[0];
            var roomname = rooms[1];
            //const username = await Mongo.getPlayerBySocketId(roomname, socketId);

            // Remove player from room.
            const username = await Mongo.removePlayerBySocketId(roomname, socketId);

            // Check to make sure user has left the room and not refreshed.            
            if (username){
                setTimeout(async function () {
                    const currentUsers = await Mongo.getUsersInRoom(roomname);
                    if (currentUsers.map(x => x.username).includes(username) === false) {
                        if (currentUsers.length === 0){
                            console.log("deleting room");
                            Mongo.deleteRoom(roomname);
                        } else {
                            // Send disconnect message in chat
                            const messageObject = {
                                username: username, 
                                message: "", 
                                event: "disconnected"
                            };
                            await Mongo.addMessage(roomname, messageObject);
                            io.to(roomname).emit('chat', messageObject);
                            
                            // Send online users array.
                            io.to(roomname).emit('online-users', (await Mongo.getUsersInRoom(roomname)))
                        }
                    }
                }, 3000);
            }
            
        })
    })
}

module.exports = socket;