const {newGame} = require('./newgame');
const {Statistics} = require('./statistics');
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

        socket.on('joined-user', async (data) => { 
            // Store connected user in database.
            var user = {
                socket: socket.id,
                username: data.username,
                show: false,
                team: randomTeam(),
                stats: [],
                toBeDeleted: false,
            }

            firstPlayer = true;
            if(await Mongo.roomExists(data.roomname)){
                // Check to see if username exists as a recently marked user.
                if (await Mongo.deletedUsernameExistsInRoom(data.roomname, data.username)){
                    // Take over old username that exists.
                    await Mongo.updateSocketId(data.roomname, data.username, socket.id);
                } else {
                    Mongo.addPlayer(data.roomname, user);
                }
                firstPlayer = false;
            }
            else{
                // First user to enter a room.
                Mongo.createRoom({
                    _id: data.roomname,
                    players: [user], // Array of players connected to the room.
                    words: await newGame(), // Initialize the board for the room.
                    messages: [], // Storage of chat messages for the room.
                    isRedTurn: false,
                })

            }

            // Joining the Socket Room.
            socket.join(data.roomname);
    
            // Creating new board in the room.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: firstPlayer,
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
                new: true,
            });
            io.to(data.roomname).emit('reset-display', {});
        })

        // Lock all roles and teams.
        socket.on('lock-variables', (data) => {
            io.to(data.roomname).emit('lock-variables', {});
        })

        // Reset turn when game restarts.
        socket.on('reset-turns', async (data) => {
            await Mongo.resetTurn(data.roomname);
        })

        socket.on('play-game-spy', async (data) => {
            if(data.time){
                // Update database with time spent and turn.
                const stat = {
                    time: data.time,
                }
                await Mongo.addTurnStatistics(data.roomname, data.username, stat);
            }
            await Mongo.changeTurn(data.roomname);
            const redTurn = await Mongo.getIsRedTurn(data.roomname);
            var spy;
            if (redTurn){
                spy = await Mongo.getUsernameOfRedSpymaster(data.roomname);
            } else {
                spy = await Mongo.getUsernameOfBlueSpymaster(data.roomname);
            }
            io.to(data.roomname).emit('show-current-spy', {
                username: spy,
                turn: redTurn,
            });
        })

        socket.on("play-game-operator", async (data) => {
            if(data.time){
                // Update database with time spent and turn.
                const stat = {
                    time: data.time,
                }
                await Mongo.addTurnStatistics(data.roomname, data.username, stat);
            }
            const redTurn = await Mongo.getIsRedTurn(data.roomname);
            var op;
            if (redTurn){
                op = await Mongo.getUsernameOfRedOperator(data.roomname);
            } else {
                op = await Mongo.getUsernameOfBlueOperator(data.roomname);
            }
            io.to(data.roomname).emit('show-current-operator', {
                username: op,
                clue: data.clue,
                number: data.number,
                turn: redTurn,
            });
        })

        socket.on('ensure-four-players', async (data) => {
            const users = await Mongo.getUsersInRoom(data.roomname);
            console.log(users.length);
            if (users.length === 4){
                io.to(data.roomname).emit('ensure-four-players', {
                    good: true,
                    username: data.username,
                });
            } else {
                io.to(data.roomname).emit('ensure-four-players', {
                    good: false,
                    username: data.username,
                });
            }
        })

        socket.on('ensure-all-roles', async (data) => {
            if ((await Mongo.getUsernameOfRedSpymaster(data.roomname)) &&
                (await Mongo.getUsernameOfBlueSpymaster(data.roomname)) &&
                (await Mongo.getUsernameOfRedOperator(data.roomname)) &&
                (await Mongo.getUsernameOfBlueOperator(data.roomname))){
                    io.to(data.roomname).emit('ensure-all-roles', {
                        good: true,
                        username: data.username,
                    })
            } else {
                io.to(data.roomname).emit('ensure-all-roles', {
                    good: false,
                    username: data.username,
                })
            }
        })

        // Finding a word in the room.
        socket.on('find-word', async (data) => {
            const result = await Mongo.getWordInRoom(data.roomname,data.word);
            const color = await Mongo.getTeam(data.username, data.roomname);
            io.to(data.roomname).emit('found-word',{
                wordButton: result,
                color: color,
                username: data.username,
            });
        })

        socket.on('turn-over', (data) => {
            io.to(data.roomname).emit('turn-over', {
                username: data.username,
            })
        })

        socket.on('time-up', async (data) => {
            const roles = await Mongo.getRolesInRoom(data.roomname);
            console.log(data.username, roles);
            if (roles[data.username]){
                // Player is a spymaster
                io.to(data.roomname).emit('spy-turn-over', {
                    username: data.username,
                })

            } else {
                // Player is a operator
                io.to(data.roomname).emit('turn-over', {
                    username: data.username,
                })
            }
        })

        // Update a word in the room to show.
        socket.on('show-word', async (data) => {
            await Mongo.updateWordInRoom(data.roomname, data.word);
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: false,
                myturn: data.myturn,
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
                new: false,
            });
        })

        // Changing role to field operator.
        socket.on('role-change-field', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, false);
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: false,
            });
        })

        // Ending the game.
        socket.on('game-over', async (data) => {
            // Update Statistic.
            if(data.time){
                // Update database with time spent and turn.
                const stat = {
                    time: data.time,
                }
                await Mongo.addTurnStatistics(data.roomname, data.username, stat);
            }

            // Call board game first to update html.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: false,
            });

            // Upon closing the game over screen, reverts back to previous html.
            io.to(data.roomname).emit('game-over', {
                winner: data.winner,
                redScore: data.redScore,
                blueScore: data.blueScore,
                stats: (await Mongo.getAllStatisticsInRoom(data.roomname)),
            });
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

            // TODO: Mark player as deleted but don't delete yet

            // Remove player from room.
            const username = await Mongo.removePlayerBySocketId(roomname, socketId);

            // Check to make sure user has left the room and not refreshed.            
            if (username){
                setTimeout(async function () {
                    const currentUsers = await Mongo.getUsersInRoom(roomname);
                    if (currentUsers.map(x => x.username).includes(username) === false) {
                        // Send disconnect message in chat
                        const messageObject = {
                            username: username, 
                            message: "", 
                            event: "disconnected"
                        };
                        await Mongo.addMessage(roomname, messageObject);
                        io.to(roomname).emit('chat', messageObject);
                        
                        // Send online users array.
                        io.to(roomname).emit('online-users', (await Mongo.getUsersInRoom(roomname)));
                    }
                }, 3000);
            }
            
        })
    })
}

module.exports = socket;