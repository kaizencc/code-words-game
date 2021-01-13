const {MongoClient} = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');
 
/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "bJr6m5UqPuYoZMaR";
const dbName = "Cluster0";
const uri = `mongodb+srv://dbUser:${dbPassword}@cluster0.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;
var mongoDocuments;

async function addWords(name, filename) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        const db = client.db('words');
        const collection = await createCollection(db, name);
        const done = await processFile(filename, collection);
        console.log(done);
    } catch (e) {
        console.error(e);
    }
    await sleep(5000);
    await client.close();
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

function createMongoDocuments(data){
    var mongoDocuments = []
    data.forEach((word, index) =>{
        wordDoc = {
            _id: index,
            word: word
        }
        mongoDocuments.push(wordDoc);
    })
    return mongoDocuments;
}

async function processFile(filename, collection){
    fs.readFile(filename, 'utf8', async (err,data)=>{
        if(err){
            console.error(err);
            return;
        }
        const newData = processData(data);
        const documents = createMongoDocuments(newData);
        await collection.insertMany(documents);
    })
    return true;
}

//Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function replaceAll(str, match, replacement){
    return str.replace(new RegExp(escapeRegExp(match), 'g'), replacement);
}

function processData(data){
    data = replaceAll(data,",,,",",");
    data = replaceAll(data,",,",",");
    data = data.split(",");
    return data;
}

async function createCollection(db, name){
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    if (collectionNames.includes(name)){
        console.error('collection already exists');
        return;
    } else {
        await db.createCollection(name, function(err, _) {
            if (err) throw err;
            console.log(`Collection ${name} created!`);
          });
    }
    return await db.collection(name);
}

addWords('codenames','./files/test.csv').catch(console.error);
