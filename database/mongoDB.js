const {MongoClient} = require('mongodb');
 
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

// Called when app opens to populate `client` and `db`.
async function openMongoConnection(){
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        db = client.db('rooms');
        users = db.collection("users");
        // Remove all documents in collection at start of application.
        clearAll();
    } catch (e) {
        console.error(e);
    }

}

// Helper function in openMongoConnection. DO NOT CALL ANYWHERE ELSE!
async function clearAll(){
    const result = await users.deleteMany({});
    console.log(`Removed ${result.deletedCount} document(s).`)
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
async function deleteRoom(name){
    const result = await users.deleteOne({ _id: name });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}

// Add to a room that already exists.
async function addPlayer(room, player){
    const result = await users.updateOne(
        { _id: room },
        { $push: { "players": player}}
    );
    console.log(`${player.username} added to ${result.modifiedCount} room`);
}

// Find a room by roomname (_id).
function roomExists(room) {
    const result = users.countDocuments({_id: room}, { limit: 1 })
    if (result === 1) {
        return true;
    } else return false;
}

// Remove from a room that already exists.
async function removePlayer(room, player){
    const result = await users.updateOne(
        { _id: room },
        { $pull: { "players": player }}
    );
    console.log(`${player.username} removed from ${result.modifiedCount} room`);
}

async function listDatabases(){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

module.exports = {
    openMongoConnection, 
    closeMongoConnection,
    createRoom, 
    deleteRoom, 
    addPlayer,
    removePlayer,
    roomExists,
};
 