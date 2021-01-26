const {MongoClient} = require('mongodb');
const {initializeMongoWordlists} = require ('./addWordsScript');
 
/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "bJr6m5UqPuYoZMaR";
const dbName = "Cluster0";
const uri = `mongodb+srv://dbUser:${dbPassword}@cluster0.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;

// Storage variables for client connection and database
var client;
var db;
var users;
var wordDb;
var currentWordSet;

// Called when app opens to populate `client` and `db`.
async function openMongoConnection(){
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        db = client.db('rooms');
        users = db.collection("users");

        wordDb = client.db('words');
        currentWordSet = wordDb.collection("codenames2");

        // Remove all documents in collection at start of application.
        clearAll();

        // Add in word lists if necessary
        initializeMongoWordlists(wordDb);
    } catch (e) {
        console.error(e);
    }

}

// Helper function in openMongoConnection. DO NOT CALL ANYWHERE ELSE!
async function clearAll(){
    const result = await users.deleteMany({});
    console.log(`Removed ${result.deletedCount} document(s).`)
}

// Helper method for all updates.
async function updateMongoDocument(query, update){
    const result = await users.updateOne(query, update); 
    console.log(`modified ${result.modifiedCount} document(s).`)
    return result;
}

// Called when app exits.
async function closeMongoConnection(){
    await client.close();
}

// Helper function to get document by _id
// async function getDocumentById(collection, id){
//     const document = await collection.findOne({ _id: id});
//     return document;
// }

// Helper function to get players from a room.
async function getPlayersInRoom(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.players;
    }
    return null;
}

// Create room in users collection.
async function createRoom(room){
    const result = await users.insertOne(room);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}

// Delete room in users collection.
async function deleteRoom(room){
    const result = await users.deleteOne({ _id: room });
    console.log(`${result.deletedCount} document(s) were deleted.`);
}

// Add to a room that already exists.
async function addPlayer(room, player){
    const query = { _id: room};
    const updateDocument = { $push: { "players": player}};
    const result = await updateMongoDocument(query, updateDocument);
    console.log(`${player.username} added to ${result.modifiedCount} room`);
}

// Find a room by roomname (_id).
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

// Get player by socketId.
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

// Updates a player's socket Id (and reset deleted mark)
async function updateSocketId(room, username, socketId){
    var query = { _id: room, "players.username": username};
    var updateDocument = { $set: { "players.$.socket": socketId}};
    await updateMongoDocument(query, updateDocument);
    query = { _id: room, "players.username": username};
    updateDocument = { $set: { "players.$.toBeDeleted": false}};
    await updateMongoDocument(query, updateDocument);
}

// Remove player from a room that already exists.
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

// Check to see if username is among the deleted players (used when checking for refresh).
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

// Deletes all marked players and then checks if the room can be deleted as well.
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

// TODO: function that deletes marked players.

// Returns an array of a {username, team} object for the room.
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

// Returns a dictionary of username to roles in a room.
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

async function getUsernameOfRedSidekick(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === true && player.team === "red" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

async function getUsernameOfRedSuperhero(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === false && player.team === "red" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

async function getUsernameOfBlueSidekick(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === true && player.team === "blue" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

async function getUsernameOfBlueSuperhero(room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.show === false && player.team === "blue" && !player.toBeDeleted);
    if(p.length > 0){
        return p[0].username;
    } 
    console.log('DNE');
    return null;
}

async function changeTurn(room){
    const turn = await getIsRedTurn(room);
    const query = { _id: room };
    const updateDocument = { $set: { "isRedTurn": turn===false }};
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

async function resetTurn(room){
    const query = { _id: room };
    const updateDocument = { $set: { "isRedTurn": false }};
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

async function getIsRedTurn(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.isRedTurn;
    }
}

// Returns word list
async function getAllWordsInRoom(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.words;
    }
    return [];
}

// Reset all roles in a room to "field" for a new game.
async function resetRoles(room){
    const query = { _id: room };
    const updateDocument = { $set: { "players.$[].show": false }};
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

// Switch between roles.
async function switchRoles(username, room, show){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $set: { "players.$.show": show}};
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

// Change a player's team.
async function changeTeams(username, room, newTeam){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $set: { "players.$.team": newTeam}};
    console.log("change teams", room, username, newTeam);
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

// Get a player's team.
async function getTeam(username, room){
    const players = await getPlayersInRoom(room);
    const p = players.filter(player => player.username === username);
    if(p.length > 0){
        return p[0].team;
    } 
    console.log('DNE');
    return null;
}

// Update words with new word list.
async function updateAllWordsInRoom(room, newWords){
    const query = { _id: room};
    const updateDocument = { $set: { words: newWords}};
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

// Get a single word from the room.
async function getWordInRoom(room, word){
    const words = await getAllWordsInRoom(room);
    const result = words.filter(w => w.text === word);
    return result[0];
}

// Update a single word from the room.
async function updateWordInRoom(room, word){
    const query = { _id: room, "words.text": word};
    const updateDocument = { $set: { "words.$.show": true}};
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

// Store messages.
async function addMessage(room, messageObject){
    const query = { _id: room};
    const updateDocument = { $push: { "messages": messageObject}};
    console.log('add message')
    const answer = await updateMongoDocument(query, updateDocument);
    return answer;
}

// Get all messages from a room.
async function getAllMessages(room){
    const doc = await users.findOne({ _id: room});
    return doc.messages;
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Change rooms wordSet.
async function changeWordSet(room, newWordSet){
    const query = { _id: room};
    const updateDocument = { $set: { wordSet: newWordSet}};
    await updateMongoDocument(query, updateDocument);
}

async function getWordSet(room){
    const doc = await users.findOne({ _id: room});
    console.log(doc.wordSet, room);
    return doc.wordSet;
}

// Get word array from array of ids using the wordset collection.
async function getWordArray(room){
    var currentWordSet;
    if(room){
        currentWordSet = wordDb.collection(await getWordSet(room));
    } else {
        currentWordSet = wordDb.collection("codewords");
    }
    const size = await currentWordSet.countDocuments();
    var arr = []
    var usedSet = new Set();
    for(var i=0; i<25; i++){
        var num = randomIntFromInterval(0,size-1);
        // No duplicates.
        while (usedSet.has(num)) {
            console.log(num);
            num = randomIntFromInterval(0,size-1);
        }
        usedSet.add(num);
        arr.push(num);
    }
    const cursor = await currentWordSet.find({_id: {"$in": arr} });
    const allValues = await cursor.toArray();
    return allValues;
}

// Get time for timer.
async function getTime(room) {
    const doc = await users.findOne({ _id: room});
    console.log(doc.time, room);
    return doc.time;
}

async function changeTime(room, time){
    const query = { _id: room};
    const updateDocument = { $set: { time: time }};
    await updateMongoDocument(query, updateDocument);
}

// Adds a statistic to the player.
async function addTurnStatistics(room, username, stat){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $push: { "players.$.stats": stat}};
    const answer = await updateMongoDocument(query, updateDocument);
    console.log(`${username} added a statistic.`);
}

// Returns all the times in the room as an object {username: time}
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
    addMessage,
    getAllMessages,
    getWordArray,
    changeWordSet,
    getAllStatisticsInRoom,
    addTurnStatistics,
    garbageCollector,
    getTime,
    changeTime,
};
 