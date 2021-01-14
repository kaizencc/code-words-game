const Mongo = require('../database/mongoDB');

const buttonColor = {
    BLUE: 'btn-primary',
    GRAY: 'btn-secondary',
    RED: 'btn-danger',
    BLACK: 'btn-dark',
    YELLOW: 'btn-warning'
}

async function newGame(){
    newWords = [];
    const array = await Mongo.getWordArray();
    for(var i=0; i<25; i++){
        const button = {
            text: array[i],
            color: buttonColor.YELLOW,
            show: false,
        }
        newWords.push(button);
    }
    newWords = shuffle(newWords);
    newWords = selectColors(newWords);
    return newWords;
}

// Utility function to randomly select words for each team, along with the bomb word.
function selectColors(array){
    randomArray=[]
    for(var i=0; i<25; i++){
        randomArray.push(i)
    }
    indexes = shuffle(randomArray);

    // Select one black card.
    array[indexes[0]].color = buttonColor.BLACK

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

// Helper function to shuffle using Fisher-Yates.
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

module.exports = newGame;