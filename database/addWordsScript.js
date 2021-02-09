const {MongoClient} = require('mongodb');
const fs = require('fs');
const path = require('path'); 

/**
 * Allow a user to input a csv of custom words to be parsed and added as a mongoDb collection.
 * 
 * @param {dbInstance} db The mongoDb instance.
 * @param {string} name The name of the collection.
 * @param {string} string The file string to process as csv.
 */
async function addCustomWords(db, name, string){
    const collection = await createCollection(db, name);
    const newData = processData(string);
    const documents = createMongoDocuments(newData);
    await collection.insertMany(documents);
}

/**
 * Add words from a csv file to a new mongoDB collection.
 * 
 * @param {dbInstance} db The mongoDB instance.
 * @param {string} name The name of the collection.
 * @param {string} filename Name of the file to parse.
 */
async function addWords(db, name, filename) {
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

/**
 * Helper function to wait for other processes to finish.
 * 
 * @param {number} ms milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

/**
 * Transform array of words into array of word documents.
 * 
 * @param {[{string, number}]} data The word data
 */
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

/**
 * Process the given file name data into mongo documents.
 * 
 * @param {string} filename The name of the parsed file.
 * @param {string} collection The collection name.
 */
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

/**
 * Helper function to prepare regex expression of a string needing to replace all instances of a character.
 * Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions.
 * 
 * @param {string} string 
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Helper function to replace all instances of 'match' with 'replacement'.
 * Taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions.
 * 
 * @param {string} str The string to get replacements.
 * @param {string} match The character to remove.
 * @param {string} replacement The new character to add.
 */
function replaceAll(str, match, replacement){
    return str.replace(new RegExp(escapeRegExp(match), 'g'), replacement);
}

/**
 * Process data for consumption by mongoDB.
 * 
 * @param {[string]} data 
 */
function processData(data){
    data = replaceAll(data,"\r",",");
    data = replaceAll(data,"\n",",");
    data = replaceAll(data,",,,",",");
    data = replaceAll(data,",,",",");
    data = replaceAll(data," ", ",");
    data = data.split(",");
    data = data.filter(word => word.length > 2);
    console.log(data);
    return data;
}

// create the collection (must not exist)
/**
 * Create a new database collection. It must not exist yet.
 * 
 * @param {dbInstance} db The database to add a collection to.
 * @param {string} name The name of the new collection.
 */
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

/**
 * Initialize the selected word lists at the start of the application if they somehow are not present in the database yet.
 * 
 * @param {dbInstance} db The database.
 */
function initializeMongoWordlists(db){
    addWords(db, 'codewords',path.join(__dirname, "files/codes.csv")).catch(console.error);
    addWords(db, 'codewords-nsfw',path.join(__dirname, "files/nsfw.csv")).catch(console.error);
    addWords(db, 'codewords-duet',path.join(__dirname, "files/code-duet.csv")).catch(console.error);
}

module.exports = {initializeMongoWordlists, addCustomWords};