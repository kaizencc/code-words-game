const {MongoClient} = require('mongodb');
 
/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "bJr6m5UqPuYoZMaR";
const dbName = "Cluster0";
const uri = `mongodb+srv://dbUser:${dbPassword}@cluster0.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;

async function addWords(name) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        const db = client.db('words');
        const collection = await getOrCreateCollection(db, name);
        await collection.insertMany([{_id: 1, word: "test"}, {_id: 2, word: "test-test"}]);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function getOrCreateCollection(db, name){
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    console.log(collectionNames);
    if (!collectionNames.includes(name)){
        console.log(name);
        await db.createCollection(name, function(err, _) {
            if (err) throw err;
            console.log(`Collection ${name} created!`);
          });
    }
    return db.collection(name);
}

addWords('codenames').catch(console.error);

