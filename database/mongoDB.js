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

// Called when app opens to populate `client` and `db`.
async function openMongoConnection(){
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        db = client.db('rooms');
        wordDb = client.db('words');
        users = db.collection("users");

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

// Helper function to get players from a room.
async function getPlayersInRoom(room){
    const document = await users.findOne({ _id: room});
    if(document){
        return document.players;
    }
    return null;
}

// Called when app exits.
async function closeMongoConnection(){
    await client.close();
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
async function roomExists(room) {
    const result = await users.countDocuments({_id: room}, { limit: 1 })
    console.log(result);
    if (result === 1) {
        return true;
    } else return false;
}

// Remove player from a room that already exists.
async function removePlayerBySocketId(room, socketId){
    // First, find username of player.
    const doc = await users.findOne({ _id: room});
    console.log(doc.players);
    const socketUser = doc.players.filter(function (player) {
        return player.socket === socketId;
    });
    const username = socketUser[0].username;

    // Remove user.
    const query = { _id: room};
    const updateDocument = { $pull: { "players": { "socket": socketId} }};
    await updateMongoDocument(query, updateDocument);
    
    console.log(`${username} removed from ${room}`);
    return username;
}

// Returns an array of all the usernames in a room.
async function getUsernamesInRoom(room){
    const result = await getPlayersInRoom(room);
    var players = []
    if (result){
        result.forEach((player) => {
            players.push(player.username);
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
            roles[player.username] = player.show;
        })
    }
    return roles;
}

// Returns word list
async function getWords(room){
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
    return updateMongoDocument(query, updateDocument);
}

// Switch between roles.
async function switchRoles(username, room, bool){
    const query = { _id: room, "players.username": username};
    const updateDocument = { $set: { "players.$.show": bool}};
    return updateMongoDocument(query, updateDocument);
}

// Update words with new word list.
async function updateWords(room, newWords){
    const query = { _id: room};
    const updateDocument = { $set: { words: newWords}};
    return updateMongoDocument(query, updateDocument);
}

// Store messages.
async function addMessage(room, messageObject){
    const query = { _id: room};
    const updateDocument = { $push: { "messages": messageObject}};
    console.log('add message')
    return updateMongoDocument(query, updateDocument);
}

// Get all messages from a room.
async function getAllMessages(room){
    const doc = await users.findOne({ _id: room});
    return doc.messages;
}

module.exports = {
    openMongoConnection, 
    closeMongoConnection,
    createRoom, 
    deleteRoom, 
    addPlayer,
    removePlayerBySocketId,
    roomExists,
    getUsernamesInRoom,
    getRolesInRoom,
    getWords,
    resetRoles,
    switchRoles,
    updateWords,
    addMessage,
    getAllMessages,
};
 