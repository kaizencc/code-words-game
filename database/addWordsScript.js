const {MongoClient} = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');
 
/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "bJr6m5UqPuYoZMaR";
const dbName = "Cluster0";
const uri = `mongodb+srv://dbUser:${dbPassword}@cluster0.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;
var mongoDocuments;

async function addWords(name) {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        const db = client.db('words');
        const collection = await getOrCreateCollection(db, name);
        console.log(mongoDocuments);
        const documents = readFile('./files/test.csv');
        console.log("after");

        console.log(mongoDocuments);
        await collection.insertMany([{_id: 1, word: "test"}, {_id: 2, word: "test-test"}]);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

function createMongoDocuments(data){
    mongoDocuments = []
    data.forEach((word, index) =>{
        wordDoc = {
            _id: index,
            word: word
        }
        mongoDocuments.push(wordDoc);
    })
}

function readFile(filename){
    fs.readFile(filename, 'utf8', (err,data)=>{
        if(err){
            console.error(err);
            return;
        }
        const newData = processData(data);
        console.log(newData);
        createMongoDocuments(newData);
    })
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

async function getOrCreateCollection(db, name){
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
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
// readFile('./files/test.csv');
