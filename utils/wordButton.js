const buttonColor = {
    BLUE: 'btn btn-primary',
    GRAY: 'btn btn-secondary',
    RED: 'btn btn-danger',
    BLACK: 'btn btn-dark'
}

class WordButton {
    constructor(word, color) {
        this.word = word;
        this.color = color; // buttonColor
        //this.button = button; // HTML Element
        this.show = false;
    }
}

var words = {}

// Funtion to get users online in a room
function getWords(arr){
    roomWords = [];
    arr.forEach((w) => {
        roomWords.push(Object.values(w)[0])
    })
    return roomWords;
}

function newGame(){
    newWords = []
    for(var i=0; i<25; i++){
        const button = new WordButton(i, buttonColor.GRAY);
        newWords.push(button);
    }
    return newWords;
}



module.exports = {words, getWords, newGame};