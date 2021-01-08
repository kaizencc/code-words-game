const {MongoClient} = require('mongodb');
 
/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "bJr6m5UqPuYoZMaR";
const dbName = "Cluster0";
const uri = `mongodb+srv://dbUser:${dbPassword}@cluster0.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;
var client;

async function openMongoConnection(){
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        // Connect to the MongoDB cluster
        await client.connect();
    } catch (e) {
        console.error(e);
    }
}

async function closeMongoConnection(){
    await client.close();
}

async function create(data){
 
    try { 
        // Make the appropriate DB calls
        await createRoom(client, data);
 
    } catch (e) {
        console.error(e);
    }
}

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

async function createRoom(client, room){
    const result = await client.db('rooms').collection("users").insertOne(room);
    console.log(`New listing created with the following id: ${result.insertedId}`);
}

module.exports = {create, openMongoConnection, closeMongoConnection};
 