const Mongo = require('../database/mongoDB');

const buttonColor = {
    BLUE: 'btn-primary',
    GRAY: 'btn-secondary',
    RED: 'btn-danger',
    BLACK: 'btn-success',
    YELLOW: 'btn-warning'
}

/**
 * Picks 25 random words to be used on the board, shuffles them, and assigns each a color.
 * 
 * @param {string} room The roomname.
 */
async function newGame(room){
    // Find number of words in the current word set.
    const size = await Mongo.countNumberOfWords(room);

    // Pick 25 random numbers between 0 and size.
    const arrayIDs = selectRandomIDs(size);

    // Get words with the given IDs.
    const array = await Mongo.getWordArray(room, arrayIDs);

    // Create button objects for each word.
    newWords = [];
    for(var i=0; i<25; i++){
        const button = {
            text: array[i].word,
            color: buttonColor.YELLOW,
            show: false,
        }
        newWords.push(button);
    }
    newWords = shuffle(newWords);
    newWords = selectColors(newWords);
    return newWords;
}

/**
 * Selects random non-repeating ID numbers between 0 and size.
 * 
 * @param {number} size The maximum ID number
 */
function selectRandomIDs(size){
    // Randomly select 25 words from the set.
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
    return arr;
}

/**
 * Helper function to get a random number between min and max.
 * @param {number} min 
 * @param {number} max 
 */
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Helper function to randomly select colors for each word.
 * 9 red cards, 8 blue cards, 1 green (bomb) card, the rest yellow.
 * 
 * @param {[HTMLElement]} array Array of buttons.
 */
function selectColors(array){
    randomArray=[]
    for(var i=0; i<25; i++){
        randomArray.push(i)
    }
    indexes = shuffle(randomArray);

    // Select one black card.
    array[indexes[0]].color = buttonColor.BLACK;

    // Select nine blue cards and eight red cards.
    for(var i=1; i<18; i++){
        if(i%2==0){
            array[indexes[i]].color = buttonColor.BLUE;
        } else {
            array[indexes[i]].color = buttonColor.RED;
        }
        
    }
    return array;
}

/**
 * Helper function to shuffle array in place using Fisher-Yates algorithm.
 * 
 * @param {[number]} array Array if word IDs
 */
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle.
    while (0 !== currentIndex) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
}

module.exports = {newGame, buttonColor, shuffle};