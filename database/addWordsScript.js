const {MongoClient} = require('mongodb');
const fs = require('fs');
const path = require('path'); 

/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "bJr6m5UqPuYoZMaR";
const dbName = "Cluster0";
const uri = `mongodb+srv://dbUser:${dbPassword}@cluster0.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;

async function addWords(db, name, filename) {
    const newClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        const collection = await createCollection(db, name);
        if (collection) {
            await processFile(filename, collection);
            await sleep(1000);
        }
    } catch (e) {
        console.error(e);
    }
}

// Helper function to wait for other processes to finish.
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

// Transform array of words into array of word documents.
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

// Process the given file name data into mongo documents.
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

// Process data for consumption by mongo.
function processData(data){
    data = replaceAll(data,",,,",",");
    data = replaceAll(data,",,",",");
    data = data.split(",");
    return data;
}

// create the collection (must not exist)
async function createCollection(db, name){
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    if (collectionNames.includes(name)){
        console.error('collection already exists');
        return null;
    } else {
        await db.createCollection(name, function(err, _) {
            if (err) throw err;
            console.log(`Collection ${name} created!`);
          });
    }
    return await db.collection(name);
}

function initializeMongoWordlists(db){
    addWords(db, 'codenames',path.join(__dirname, "files/codes.csv")).catch(console.error);
    addWords(db, 'codenames2',path.join(__dirname, "files/codes2.csv")).catch(console.error);
    addWords(db, 'codenames-duet',path.join(__dirname, "files/code-duet.csv")).catch(console.error);
}

module.exports = {initializeMongoWordlists};