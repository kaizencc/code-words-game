const {newGame, shuffle} = require('./newgame');
const Mongo = require('../database/mongoDB');
const fs = require('fs');
var Filter = require('bad-words'),
filter = new Filter();

function randomTeam(){
    if (Math.floor(Math.random() * 2) === 0){
        return "red";
    } else {
        return "blue";
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

var playersInLobby = [];
var roomnumber = 1;

// Socket connection.
function socket(io) {
    io.on('connection', (socket) => {

        // Lobby is one room that everyone can access.
        socket.on('lobby', () => {
            socket.join('lobby');
            io.to('lobby').emit('display-lobby', {players: playersInLobby})
        })

        // Join the lobby queue.
        socket.on('join-lobby', (data) => {
            Mongo.addLobbyPlayer(data.username);
            var success = true;
            if (data.username !== filter.clean(data.username)){
                io.to('lobby').emit('bad-username', {reason: "profanity"});
                success = false;
            }
            playersInLobby.forEach((player) => {
                if (player.username === data.username){
                    io.to('lobby').emit('bad-username', {reason: "duplicate"});
                    success = false;
                }
            })
            if (success){
                playersInLobby.push({
                    username: data.username,
                    socket: socket.id,
                    first: false,
                })
                if(playersInLobby.length == 4){
                    playersInLobby[0].first = true;
                    console.log(playersInLobby[0]);
                    io.to('lobby').emit('enter-room', {
                        players: playersInLobby,
                        roomname: `lobbyroom${roomnumber}`,
                    });
                    playersInLobby = [];
                    roomnumber +=1;
                }
                io.to('lobby').emit('display-lobby', {
                    username: data.username,
                    players: playersInLobby,
                });
            }
        })

        socket.on('leave-lobby', () => {
            playersInLobby = playersInLobby.filter(player => player.socket !== socket.id);
            io.to('lobby').emit('display-lobby', {players: playersInLobby});
        })

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
            if(await Mongo.roomExists(data.roomname, false)){
                // Janky, but needs to wait a second to make sure disconnecting database calls are finished.
                await sleep(500);
                // Check to see if username exists as a recently marked user.
                if (await Mongo.deletedUsernameExistsInRoom(data.roomname, data.username)){
                    // Take over old username that exists.
                    await Mongo.updateSocketId(data.roomname, data.username, socket.id);
                } else {
                    await Mongo.addPlayer(data.roomname, user);
                }
                firstPlayer = false;
            }
            else{
                // First user to enter a room.
                await Mongo.createRoom({
                    _id: data.roomname,
                    players: [user], // Array of players connected to the room.
                    words: [], // Initialize the board for the room.
                    wordSet: "codewords", // Initial name of word set.
                    messages: [], // Storage of chat messages for the room.
                    gameStatistics: [], // Storage of statistics for each game.
                    isRedTurn: false,
                    time: 60, // For timer.
                })

                await Mongo.updateAllWordsInRoom(data.roomname, await newGame(data.roomname));

            }

            // Joining the Socket Room.
            socket.join(data.roomname);

            // If not a refresh, will send join message.
            io.to(data.roomname).emit('check-refresh', {
                username: data.username, 
                roomname: data.roomname,
            });

            // Send online users array.
            io.to(data.roomname).emit('online-users', (await Mongo.getUsersInRoom(data.roomname)));

            // Creating new board in the room.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: firstPlayer,
                username: data.username,
            });
            
            // Update messages if necessary.
            if(!firstPlayer){
                // Get messages from database.
                const messageArray = await Mongo.getAllMessages(data.roomname);
                console.log(messageArray);

                // Write each message.
                messageArray.forEach(function (messageObject) {
                    // Inject username so room only updates one client.
                    messageObject.forUser = data.username;
                    io.to(data.roomname).emit('chat', messageObject);
                });
            }

            // Add player to leaderboard database if not there already.
            Mongo.addToLeaderboard(data.username, data.roomname);
        })

        socket.on('join-message', async (data) => {
            // Emitting New Username to Clients.
            const messageObject = {
                username: data.username, 
                message: "", 
                event: "joined",
            };
            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);
        })

        // Changing word set.
        socket.on('change-word-set', async (data) => {

            if (data.set === "custom"){
                await Mongo.addCustomWordSet(data.filename, data.filestring);
            }

            io.to(data.roomname).emit('change-word-set', {set: data.set});
            
            const collection = data.filename || data.set; 
            await Mongo.changeWordSet(data.roomname, collection);
            // Emitting word set change to clients.
            const messageObject = {
                username: data.username, 
                message: data.set, 
                event: "wordset",
            };
            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);
        })

        // Changing time.
        socket.on('change-time', async (data) => {
            io.to(data.roomname).emit('change-time', {time: data.time});
            await Mongo.changeTime(data.roomname, data.time);
            var messageObject;
            if (data.time > 0){
                // Emitting time change to clients.
                messageObject = {
                    username: data.username, 
                    message: data.time, 
                    event: "time",
                };
            } else {
                // Turning off timer.
                messageObject = {
                    username: data.username, 
                    message: data.time, 
                    event: "notime",
                };
            }

            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);
        })

        // Creating a new game.
        socket.on('new-game', async (data) => {
            // Alert users of new game
            const messageObject = {
                username: data.username, 
                message: "new game", 
                event: "new"
            };
            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);

            // Get word set
            // only useful for special case Chinese words
            // TODO: figure out rendering better!
            const wordset = await Mongo.getWordSet(data.roomname);

            // Update words.
            await Mongo.updateAllWordsInRoom(data.roomname, await newGame(data.roomname));

            // Reset roles.
            await Mongo.resetRoles(data.roomname);

            // Clear statistics, if any.
            await Mongo.clearPlayerStatistics(data.roomname);

            // Update board.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                wordset: wordset,
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

        socket.on('play-game-sidekick', async (data) => {
            if(data.time){
                // Update database with time spent and turn.
                const stat = {
                    time: data.time,
                    correct: data.buttonCount - data.cryptonight - data.wrong - data.yellow,
                    yellow: data.yellow,
                    opposite: data.wrong,
                    cryptonight: data.cryptonight,
                }
                await Mongo.addTurnStatistics(data.roomname, data.username, stat);
            }
            await Mongo.changeTurn(data.roomname);
            const redTurn = await Mongo.getIsRedTurn(data.roomname);
            var sidekick;
            if (redTurn){
                sidekick = await Mongo.getUsernameOfRedSidekick(data.roomname);
            } else {
                sidekick = await Mongo.getUsernameOfBlueSidekick(data.roomname);
            }
            io.to(data.roomname).emit('show-current-sidekick', {
                username: sidekick,
                turn: redTurn,
                time: await Mongo.getTime(data.roomname),
            });
        })

        socket.on("play-game-superhero", async (data) => {
            if(data.time){
                // Update database with time spent and turn.
                const stat = {
                    time: data.time,
                    number: data.number,
                }
                console.log("SIDE", stat);
                await Mongo.addTurnStatistics(data.roomname, data.username, stat);
            }
            const redTurn = await Mongo.getIsRedTurn(data.roomname);
            var superhero;
            if (redTurn){
                superhero = await Mongo.getUsernameOfRedSuperhero(data.roomname);
            } else {
                superhero = await Mongo.getUsernameOfBlueSuperhero(data.roomname);
            }
            io.to(data.roomname).emit('show-current-superhero', {
                username: superhero,
                clue: data.clue,
                number: data.number,
                turn: redTurn,
                time: await Mongo.getTime(data.roomname),
            });
        })

        socket.on('ensure-four-players', async (data) => {
            const users = await Mongo.getUsersInRoom(data.roomname);
            console.log(users.length);
            if (users.length === 4){
                io.to(data.roomname).emit('ensure-four-players', {
                    good: true,
                    username: data.username,
                    situation: data.situation,
                });
            } else {
                io.to(data.roomname).emit('ensure-four-players', {
                    good: false,
                    username: data.username,
                });
            }
        })

        socket.on('ensure-all-roles', async (data) => {
            if ((await Mongo.getUsernameOfRedSidekick(data.roomname)) &&
                (await Mongo.getUsernameOfBlueSidekick(data.roomname)) &&
                (await Mongo.getUsernameOfRedSuperhero(data.roomname)) &&
                (await Mongo.getUsernameOfBlueSuperhero(data.roomname))){
                    io.to(data.roomname).emit('ensure-all-roles', {
                        good: true,
                        username: data.username,
                    })
            } else {
                var users = await Mongo.getUsersInRoom(data.roomname);
                const roles = await Mongo.getRolesInRoom(data.roomname);
                users.forEach(user => user.role = roles[user.username]);
                io.to(data.roomname).emit('ensure-all-roles', {
                    good: false,
                    username: data.username,
                    users: users,
                })
            }
        })

        socket.on('randomize-teams-and-roles', async (data) => {
            const usernames = await Mongo.getUsersInRoom(data.roomname); // [{username, team}]
            var array = [1,2,3,4];
            array = shuffle(array);
            for(var i=0; i<4; i++){
                const user = usernames[i].username;
                const team = usernames[i].team;
                console.log(user, team);
                if (array[i] === 1){
                    // Change to red spymaster
                    if (team === "blue"){
                        Mongo.changeTeams(user, data.roomname, "red");
                    }
                    Mongo.switchRoles(user, data.roomname, true);
                } else if (array[i] === 2){
                    // Change to red superhero
                    if (team === "blue"){
                        Mongo.changeTeams(user, data.roomname, "red");
                    }
                    Mongo.switchRoles(user, data.roomname, false);
                } else if (array[i] === 3){
                    // Change to blue spymaster
                    if (team === "red"){
                        Mongo.changeTeams(user, data.roomname, "blue");
                    }
                    Mongo.switchRoles(user, data.roomname, true);
                } else {
                    // Change to blue superhero
                    if (team === "red"){
                        Mongo.changeTeams(user, data.roomname, "blue");
                    }
                    Mongo.switchRoles(user, data.roomname, false);
                }
            }

            // Send online users array.
            io.to(data.roomname).emit('online-users', (await Mongo.getUsersInRoom(data.roomname)));
        
            // Send new board game roles information.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: false,
            });

            // Alert players in the chat.
            const messageObject = {
                username: data.username, 
                redSuperhero: await Mongo.getUsernameOfRedSuperhero(data.roomname),
                redSidekick: await Mongo.getUsernameOfRedSidekick(data.roomname), 
                blueSuperhero: await Mongo.getUsernameOfBlueSuperhero(data.roomname),
                blueSidekick: await Mongo.getUsernameOfBlueSidekick(data.roomname), 
                event: "randomize",
            };
            io.to(data.roomname).emit('chat', messageObject);
        })

        // Finding a word in the room.
        socket.on('find-word', async (data) => {
            const result = await Mongo.getWordInRoom(data.roomname,data.word);
            const color = await Mongo.getTeam(data.username, data.roomname);
            const redScore = await Mongo.getScore(data.roomname, 'red');
            const blueScore = await Mongo.getScore(data.roomname, 'blue');
            console.log(redScore, blueScore);
            io.to(data.roomname).emit('found-word',{
                wordButton: result,
                color: color,
                username: data.username,
                redScore: redScore,
                blueScore: blueScore,
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
                // Player is a sidekick
                io.to(data.roomname).emit('sidekick-turn-over', {
                    username: data.username,
                })

            } else {
                // Player is a superhero
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

        // Changing role to sidekick.
        socket.on('role-change-sidekick', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, true);
            io.to(data.roomname).emit('board-game', {
                username: data.username,
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: false,
            });
        })

        // Changing role to superhero.
        socket.on('role-change-superhero', async (data) => {
            await Mongo.switchRoles(data.username, data.roomname, false);
            io.to(data.roomname).emit('board-game', {
                username: data.username,
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
                    correct: data.buttonCount - data.cryptonight - data.wrong - data.yellow,
                    yellow: data.yellow,
                    opposite: data.wrong,
                    cryptonight: data.cryptonight,
                }
                await Mongo.addTurnStatistics(data.roomname, data.username, stat);
            }

            // Call board game first to update html.
            io.to(data.roomname).emit('board-game', {
                roles: (await Mongo.getRolesInRoom(data.roomname)), 
                words: (await Mongo.getAllWordsInRoom(data.roomname)),
                new: false,
            });

            // Run confetti for winners.
            if (data.winner == "red"){
                winner1 = await Mongo.getUsernameOfRedSuperhero(data.roomname);
                winner2 = await Mongo.getUsernameOfRedSidekick(data.roomname);
            } else {
                winner1 = await Mongo.getUsernameOfBlueSuperhero(data.roomname);
                winner2 = await Mongo.getUsernameOfBlueSidekick(data.roomname);
            }
            io.to(data.roomname).emit('confetti', {
                winners: [winner1, winner2],
            })

            // Rest for 3 seconds.
            await sleep(3000);

            // Emit modal. Upon closing the game over screen, reverts back to previous html.
            io.to(data.roomname).emit('game-over', {
                winner: data.winner,
                redScore: data.redScore,
                blueScore: data.blueScore,
                stats: (await Mongo.getAllStatisticsInRoom(data.roomname)),
                redSuperhero: (await Mongo.getUsernameOfRedSuperhero(data.roomname)),
                blueSuperhero: (await Mongo.getUsernameOfBlueSuperhero(data.roomname)),
                redSidekick: (await Mongo.getUsernameOfRedSidekick(data.roomname)),
                blueSidekick: (await Mongo.getUsernameOfBlueSidekick(data.roomname)),
            });

            // Message in the chat.
            const messageObject = {
                username: null, 
                message: `${capitalizeFirstLetter(data.winner)} team won: Red: ${data.redScore} <--> Blue: ${data.blueScore}.`, 
                event: "game-won",
            };
            await Mongo.addMessage(data.roomname, messageObject);
            io.to(data.roomname).emit('chat', messageObject);
        })

        socket.on('get-statistics', async (data) => {
            io.to(data.roomname).emit('get-statistics', {
                username: data.username,
                stats: (await Mongo.getGameStatisticsInRoom(data.roomname)),
                request: data.request,
            })
        })

        // When game is over, add statistics to monogDb.
        socket.on('add-endgame-statistic', async (data) => {
            await Mongo.addEndgameStatistic(data.roomname, data.gameStats);
        })

        socket.on('update-leaderboard', async (data) => {
            for (const [username, stats] of Object.entries(data.leaderboardStats)) {
                if(stats.role === "sidekick"){
                    Mongo.addSidekickToLeaderboard(username, data.roomname, stats);
                } else {
                    Mongo.addSuperheroToLeaderboard(username, data.roomname, stats);
                }
            }
            console.log(data);
        })
    
        // Emitting messages to Clients.
        socket.on('chat', async (data) => {
            const messageObject = {
                username: data.username, 
                message: filter.clean(data.message), 
                event: data.event,
                color: data.color,
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
            rooms = rooms.filter(item => item!=socket.id);
            var roomname = rooms[0];

            // special case for disconnecting from lobby.
            if (roomname === "lobby"){
                playersInLobby = playersInLobby.filter(player => player.socket !== socket.id);
                io.to('lobby').emit('display-lobby', {players: playersInLobby});
            } else {
                // Remove player from room.
                var username = await Mongo.removePlayerBySocketId(roomname, socket.id);

                // Check to make sure user has left the room and not refreshed.            
                if (username){
                    setTimeout(async function () {
                        const currentUsers = await Mongo.getUsersInRoom(roomname);
                        if (currentUsers.map(x => x.username).includes(username) === false) {
                            // Send disconnect message in chat
                            const messageObject = {
                                username: username, 
                                message: "", 
                                event: "disconnected",
                            };
                            await Mongo.addMessage(roomname, messageObject);
                            io.to(roomname).emit('chat', messageObject);
                            
                            // Send online users array.
                            io.to(roomname).emit('online-users', (await Mongo.getUsersInRoom(roomname)));
                        }
                    }, 10000);
                }
            }       
        })
    })
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = socket;