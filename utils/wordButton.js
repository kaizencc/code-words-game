const buttonColor = {
    BLUE: 'btn-primary',
    GRAY: 'btn-secondary',
    RED: 'btn-danger',
    BLACK: 'btn-dark',
    YELLOW: 'btn-warning'
}

class WordButton {
    constructor(word, color) {
        this.text = word;
        this.color = color; // buttonColor
        this.show = false;
    }
}

var words = {}

// Function to get users online in a room
function getWords(arr){
    roomWords = [];
    arr.forEach((w) => {
        roomWords.push((Object.values(w)))
    })
    return JSON.stringify(roomWords);
}

function newGame(){
    newWords = [];
    for(var i=0; i<25; i++){
        const button = new WordButton(i, buttonColor.YELLOW);
        newWords.push(button);
    }
    newWords = shuffle(newWords);
    newWords = selectColors(newWords);
    return newWords;
}

function selectColors(array){

    randomArray=[]
    for(var i=0; i<25; i++){
        randomArray.push(i)
    }
    indexes = shuffle(randomArray);

    // Select one black card
    array[indexes[0]].color = buttonColor.BLACK

    // Select nine blue cards and eight red cards
    for(var i=1; i<18; i++){
        if(i%2==0){
            array[indexes[i]].color = buttonColor.BLUE;
        } else {
            array[indexes[i]].color = buttonColor.RED;
        }
        
    }
    return array;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
}



module.exports = {words, getWords, newGame};