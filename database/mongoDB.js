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

// Called when app opens to populate `client` and `db`.
async function openMongoConnection(){
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        db = client.db('rooms');
    } catch (e) {
        console.error(e);
    }

}

async function closeMongoConnection(){
    await client.close();
}

// Create room in users collection.
async function createRoom(data){
    const result = await db.collection("users").insertOne(data);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}

// Delete room in users collection.
async function deleteRoom(name){
    const result = await db.collection("users").deleteOne({ _id: name });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}

async function listDatabases(){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};



module.exports = {createRoom, deleteRoom, openMongoConnection, closeMongoConnection};
 