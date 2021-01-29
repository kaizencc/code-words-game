const {MongoClient} = require('mongodb');
const {uri} = require('./mongoConfig.js'); 
// const {uri} = require('./mongoConfigExample.js'); // Example Mongo Credentials. 
const {initializeMongoWordlists} = require ('./addWordsScript');
 
/************************************************************************************
 *                              Connection Information
 ***********************************************************************************/

// Storage variables for client connection and database
var client;
var db;
var users;
var wordDb;

/**
 * Opens a connection with the MongoDB database and populates the `client` and `db` variables.
 */
async function openMongoConnection(){
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        db = client.db('rooms');
        users = db.collection("users");

        wordDb = client.db('words');

        // Remove all documents in collection at start of application.
        clearAll();

        // Add in word lists if necessary
        initializeMongoWordlists(wordDb);
    } catch (e) {
        console.error(e);
    }

}

/**
 * Closes the connection with the database.
 */
async function closeMongoConnection(){
    await client.close();
}

/************************************************************************************
 *                              Helper Methods, Unexported
 ***********************************************************************************/

/**
 * Clears all the documents in the `users` database.
 * DO NOT CALL ANYWHERE ELSE BESIDES openMongoConnection.
 */
async function clearAll(){
    const result = await users.deleteMany({});
    console.log(`Removed ${result.deletedCount} document(s).`)
}

/**
 * Generic helper function for the `updateOne` MongoDB method.
 * 
 * @param {{}} query The query to execute.
 * @param {{}} update What to update results of the query.
 * @returns {{}} result object from mongoDb.
 */
async function updateMongoDocument(query, update){
    const result = await users.updateOne(query, update); 
    console.log(`modified ${result.modifiedCount} document(s).`)
    return result;
}

/**
 * Gets all the player objects in a room.
 * 
 * @param {string} room Roomname
 */
async function getPlayersInRoom(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.players;
    }
    return null;
}

/************************************************************************************
 *                              Simple Room CRUD Functions
 ***********************************************************************************/

/**
 * Creates a new room in the users collection.
 * 
 * @param {string} room Roomname
 */
async function createRoom(room){
    const result = await users.insertOne(room);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}

/**
 * Deletes a room with the roomname in the users collection.
 * 
 * @param {string} room Roomname
 */
async function deleteRoom(room){
    const result = await users.deleteOne({ _id: room });
    console.log(`${result.deletedCount} document(s) were deleted.`);
}

/**
 * Add a player object to a room with the roomname.
 * 
 * @param {string} room Roomname
 * @param {{}} player The player object to add.
 */
async function addPlayer(room, player){
    const query = { _id: room};
    const updateDocument = { $push: { "players": player}};
    const result = await updateMongoDocument(query, updateDocument);
    console.log(`${player.username} added to ${result.modifiedCount} room`);
}

/**
 * Find a room by the roomname.
 * 
 * @param {string} room Roomname
 * @param {boolean} homepage Whether or not the request originated from the homepage.
 * @returns {boolean} If room exists.
 */
async function roomExists(room, homepage) {
    // See if room exists but can be deleted.
    if (homepage){
        await garbageCollector(room)
    };
    const result = await users.countDocuments({_id: room}, { limit: 1 });
    if (result === 1) {
        return true;
    } else return false;
}

/************************************************************************************
 *                              Deleting Player Functions
 ***********************************************************************************/

/**
 * Get a players username from their socketId.
 * 
 * @param {string} room Roomname
 * @param {string} socketId The socket of the user.
 * @returns {string} The players username.
 */
async function getPlayerBySocketId(room, socketId){
    const result = await getPlayersInRoom(room);
    if (result) {
        const socketUser = result.filter(function (player) {
            return player.socket === socketId;
        });
        const username = socketUser[0].username;
        return username;
    }
}

/**
 * This function gets called when a user refreshes and returns to the same room with a new socketId.
 * The player object gets updated with the new socketId and `toBeDeleted` gets reset to `false`.
 * 
 * @param {string} room Roomname
 * @param {string} username The players username
 * @param {string} socketId The NEW socketId of the user
 */
async function updateSocketId(room, username, socketId){
    var query = { _id: room, "players.username": username};
    var updateDocument = { $set: { "players.$.socket": socketId}};
    await updateMongoDocument(query, updateDocument);
    query = { _id: room, "players.username": username};
    updateDocument = { $set: { "players.$.toBeDeleted": false}};
    await updateMongoDocument(query, updateDocument);
}

/**
 * This function gets called when a user disconnects from the socket; they leave the room or refresh.
 * The player object does not get deleted by rather the `toBeDeleted` tag gets marked as `true`.
 * 
 * @param {string} room Roomname
 * @param {string} socketId The socket of the user.
 * @returns {string} The name of the user that was removed.
 */
async function removePlayerBySocketId(room, socketId){
    // First, find username of player.
    const username = await getPlayerBySocketId(room, socketId);
    if (username){
        // Mark as to be deleted
        const query = { _id: room, "players.username": username};
        const updateDocument = { $set: { "players.$.toBeDeleted": true}};
        await updateMongoDocument(query, updateDocument);
        
        console.log(`${username} removed from ${room}`);
        return username;
    }
}

/**
 * Checks if a username exists in the room (and has been marked as `toBeDeleted`).
 * The idea is that users cannot enter a room without a unique username so this should only be `true` when a refresh happens.
 * 
 * @param {string} room Roomname
 * @param {string} username The username of the player.
 * @returns {boolean} If the username exists in the room.
 */
async function deletedUsernameExistsInRoom(room, username){
    const players = await getPlayersInRoom(room);
    if(players){
        const p = players.filter(player => player.username === username);
        if (p.length > 1){
            console.log(`ERROR: length should be 1, but is ${p.length}`);
        }
        if (p.length === 1){
            if (!p[0].toBeDeleted){
                console.log("ERROR: toBeDeleted is not true");
                return true;
            }
            return true;
        }
    }
    return false;
}

/**
 * This function gets called when a new room gets created and should delete any dead rooms.
 * 
 * @param {string} room Roomname
 */
async function garbageCollector(room){
    const result = await getPlayersInRoom(room);
    if (result){
        result.forEach(async (player) => {
            if(player.toBeDeleted){
                const query = { _id: room};
                const updateDocument = { $pull: { "players": { "socket": player.socketId} }};
                await updateMongoDocument(query, updateDocument);
            }
        })
    }
    const users = await getUsersInRoom(room);
    if (users.length === 0){
        await deleteRoom(room);
    }

}

/************************************************************************************
 *                              Player Functions
 ***********************************************************************************/

/**
 * Gets the users in the room.
 * 
 * @param {string} room Roomname
 * @returns {{username, team}}
 */
async function getUsersInRoom(room){
    const result = await getPlayersInRoom(room);
    var players = [];
    if (result){
        result.forEach((player) => {
            if (!player.toBeDeleted){
                players.push({
                    username: player.username,
                    team: player.team,
                });
            }
        }); 
    }
    return players;
}

/**
 * Gets the users in the room along with their roles.
 * 
 * @param {string} room Roomname
 * @returns {{username: boolean}} Dictionary of usernames to whether or not they are sidekicks.
 */
async function getRolesInRoom(room){
    const result = await getPlayersInRoom(room);
    var roles = {}
    if(result){
        result.forEach((player) => {
            if (!player.toBeDeleted){
                roles[player.username] = player.show;
            }
        })
    }
    return roles;
}

/************************************************************************************
 *                              Usernames of 4 Roles
 ***********************************************************************************/

 /**
  * Gets username of the red sidekick.
  * 
  * @param {string} room Roomname
  * @returns {string | null} username if exists, null if not
  */
async function getUsernameOfRedSidekick(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === true && player.team === "red" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

 /**
  * Gets username of the red superhero.
  * 
  * @param {string} room Roomname
  * @returns {string | null} username if exists, null if not
  */
async function getUsernameOfRedSuperhero(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === false && player.team === "red" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

 /**
  * Gets username of the blue sidekick.
  * 
  * @param {string} room Roomname
  * @returns {string | null} username if exists, null if not
  */
async function getUsernameOfBlueSidekick(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === true && player.team === "blue" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

 /**
  * Gets username of the blue superhero.
  * 
  * @param {string} room Roomname
  * @returns {string | null} username if exists, null if not
  */
async function getUsernameOfBlueSuperhero(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === false && player.team === "blue" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

/************************************************************************************
 *                              Role Functions
 ***********************************************************************************/

/**
 * Resets all roles to sidekick when new game is clicked.
 * 
 * @param {string} room Roomname
 */
async function resetRoles(room){
    const query = { _id: room };
    const updateDocument = { $set: { "players.$[].show": false }};
    await updateMongoDocument(query, updateDocument);

}

/**
 * Switch from one role to another.
 * 
 * @param {string} username Player's username
 * @param {string} room Roomname
 * @param {boolean} show Whether or not to show the colors.
 */
async function switchRoles(username, room, show){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $set: { "players.$.show": show}};
    await updateMongoDocument(query, updateDocument);
}

/************************************************************************************
 *                              Turn Functions
 ***********************************************************************************/

/**
 * Gets whose turn it currently is.
 * 
 * @param {string} room Roomname
 * @returns {boolean} true if it is reds turn.
 */
async function getIsRedTurn(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.isRedTurn;
    }
}

/**
 * Changes the turn from one color to the next.
 * 
 * @param {string} room Roomname
 */
async function changeTurn(room){
    const turn = await getIsRedTurn(room);
    const query = { _id: room };
    const updateDocument = { $set: { "isRedTurn": turn===false }};
    await updateMongoDocument(query, updateDocument);
}

/**
 * Resets the turn to red when new game is clicked.
 * 
 * @param {string} room Roomname
 */
async function resetTurn(room){
    const query = { _id: room };
    const updateDocument = { $set: { "isRedTurn": false }};
    await updateMongoDocument(query, updateDocument);
}

/************************************************************************************
 *                              Team Functions
 ***********************************************************************************/

/**
 * Get the team that a player is on.
 * 
 * @param {string} room Roomname
 * @param {string} username Player's username
 * @param {string} newTeam Either "red" or "blue"
 */
async function changeTeams(username, room, newTeam){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $set: { "players.$.team": newTeam}};
    console.log("change teams", room, username, newTeam);
    await updateMongoDocument(query, updateDocument);
}

/**
 * Get the team that a player is on.
 * 
 * @param {string} room Roomname
 * @param {string} username Player's username
 * @returns {string} Either "red" or "blue"
 */
async function getTeam(username, room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.username === username);
    if(p.length > 0){
        return p[0].team;
    } 
    console.log('DNE');
    return null;
}

/************************************************************************************
 *                              Message Functions
 ***********************************************************************************/

/**
 * Stores a message in the room.
 * 
 * @param {string} room Roomname
 * @param {{}} messageObject Message that was sent.
 */
async function addMessage(room, messageObject){
    const query = { _id: room};
    const updateDocument = { $push: { "messages": messageObject}};
    console.log('add message')
    await updateMongoDocument(query, updateDocument);
}

/**
 * Returns all the messages in a room.
 * 
 * @param {string} room Roomname
 * @returns {[{}}]} Array of messageObjects
 */
async function getAllMessages(room){
    const doc = await users.findOne({ _id: room});
    return doc.messages;
}

/************************************************************************************
 *                              Word/WordSet Functions
 ***********************************************************************************/

/**
 * Returns the 25 word array in the room.
 * 
 * @param {string} room Roomname
 * @returns {[string]} The 25 words in a room.
 */
async function getAllWordsInRoom(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.words;
    }
    return [];
}

/**
 * Update words in the room with a new set of words.
 * 
 * @param {string} room Roomname
 * @param {[string]} newWords New set of words.
 */
async function updateAllWordsInRoom(room, newWords){
    const query = { _id: room};
    const updateDocument = { $set: { words: newWords}};
    await updateMongoDocument(query, updateDocument);
}

/**
 * Gets a word object from the room.
 * 
 * @param {string} room Roomname
 * @param {string} word Word
 */
async function getWordInRoom(room, word){
    const words = await getAllWordsInRoom(room);
    const result = words.filter(w => w.text === word);
    return result[0];
}

/**
 * Marks a word as `show` after it has been clicked.
 * 
 * @param {string} room Roomname
 * @param {string} word The word that was clicked.
 */
async function updateWordInRoom(room, word){
    const query = { _id: room, "words.text": word};
    const updateDocument = { $set: { "words.$.show": true}};
    await updateMongoDocument(query, updateDocument);
}

/**
 * Changes the current word set of the room.
 * 
 * @param {string} room Roomname
 * @param {string} newWordSet Name of the new word set.
 */
async function changeWordSet(room, newWordSet){
    const query = { _id: room};
    const updateDocument = { $set: { wordSet: newWordSet}};
    await updateMongoDocument(query, updateDocument);
}

/**
 * Gets the current word set of the room.
 * 
 * @param {string} room Roomname
 * @returns {[string]} The name of the wordset associated with the room.
 */
async function getWordSet(room){
    const doc = await users.findOne({ _id: room});
    console.log(doc.wordSet, room);
    return doc.wordSet;
}

/**
 * Returns the number of words in the current word set.
 * 
 * @param {string} room Roomname
 * @returns {number} number of words in the word set.
 */
async function countNumberOfWords(room){
    wordSet = wordDb.collection(await getWordSet(room));
    return wordSet.countDocuments();
}

/**
 * Finds and returns 25 random words from the word set of the room.
 * 
 * @param {string} room Roomname
 * @returns {[string]} 25 words in an array
 */
async function getWordArray(room, ids){
    // Find the word set that the room is using.
    wordSet = wordDb.collection(await getWordSet(room));
    const cursor = await wordSet.find({_id: {"$in": ids} });
    const allValues = await cursor.toArray();
    return allValues;
}

/************************************************************************************
 *                              Time Functions
 ***********************************************************************************/

/**
 * Gets the maximum amount of time per turn for the timer.
 * 
 * @param {string} room Roomname
 * @returns {number} The maximum time per turn.
 */
async function getTime(room) {
    const doc = await users.findOne({ _id: room});
    console.log(doc.time, room);
    return doc.time;
}

/**
 * Changes the maximum amount of time per turn.
 * 
 * @param {string} room Roomname
 * @param {number} time Maximum amount of time per turn.
 */
async function changeTime(room, time){
    const query = { _id: room};
    const updateDocument = { $set: { time: time }};
    await updateMongoDocument(query, updateDocument);
}

/************************************************************************************
 *                              Statistic Functions
 ***********************************************************************************/

/**
 * Adds a statistic regarding its turn for the player.
 * 
 * @param {string} room Roomname
 * @param {string} username Player username
 * @param {{}} stat Object with the specific statistics governing the turn.
 */
async function addTurnStatistics(room, username, stat){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $push: { "players.$.stats": stat}};
    const answer = await updateMongoDocument(query, updateDocument);
    console.log(`${username} added a statistic.`);
}

/**
 * Gets the statistics of each player and returns them as an object to be iterated.
 * 
 * @param {string} room Roomname
 * @returns {{username, stats, team}} Statistics for each user in the room.
 */
async function getAllStatisticsInRoom(room){
    const result = await getPlayersInRoom(room);
    var statistics = [];
    if (result){
        result.forEach((player) => {
            if (!player.toBeDeleted){
                statistics.push({
                    username: player.username,
                    stats: player.stats,
                    team: player.team,
                });
            }
        }); 
    }
    return statistics;
}

/**
 * When the game is over, add the statistics shown in the modal to the database.
 * 
 * @param {string} room Roomname
 * @param {{}} stats Statistic object to be added to the room
 */
async function addEndgameStatistic(room, stats){
    const query = { _id: room};
    const updateDocument = { $push: { "gameStatistics": stats}};
    await updateMongoDocument(query, updateDocument);
}

module.exports = {
    openMongoConnection, 
    closeMongoConnection,
    createRoom, 
    deleteRoom, 
    addPlayer,
    getPlayerBySocketId,
    updateSocketId,
    removePlayerBySocketId,
    roomExists,
    getUsersInRoom,
    deletedUsernameExistsInRoom,
    getRolesInRoom,
    getUsernameOfRedSidekick,
    getUsernameOfRedSuperhero,
    getUsernameOfBlueSidekick,
    getUsernameOfBlueSuperhero,
    changeTurn,
    resetTurn,
    getIsRedTurn,
    getAllWordsInRoom,
    resetRoles,
    switchRoles,
    changeTeams,
    getTeam,
    updateAllWordsInRoom,
    getWordInRoom,
    updateWordInRoom,
    countNumberOfWords,
    addMessage,
    getAllMessages,
    getWordArray,
    changeWordSet,
    getAllStatisticsInRoom,
    addTurnStatistics,
    addEndgameStatistic,
    garbageCollector,
    getTime,
    changeTime,
};
 