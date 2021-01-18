// All 4 possible displays.
const displayStart = document.getElementById('display-start');
const displayForm = document.getElementById('display-form');
const displayClue = document.getElementById('display-clue');
const displayIdle = document.getElementById('display-idle');

// Start Display Elements.
const startgame = document.getElementById('start-game');

startgame.addEventListener('click', ()=>{
    console.log('game started');
    // Any authentication checks needed here
    socket.emit('play-game-spy', {roomname: roomname});
})

// Form Display Elements.
const sendClue = document.getElementById('sendin');
const clue = document.getElementById('clue');
const number = document.getElementById('number');

sendClue.addEventListener('click', ()=>{
    // Make sure number is valid.
    checkInp();
    socket.emit('play-game-operator', {
        roomname: roomname,
        clue: clue.value,
        number: number.value,
    });

    // Empty values.
    number.value = "";
    clue.value = "";
})

function checkInp() {
    var x= number.value;
    var regex=/^[0-9]+$/;
    if (!x.match(regex)){
        alert("Must input numbers");
        return false;
    }
}

// Clue Display Elements.
const receivedClue = document.getElementById('received-clue');
const endTurn = document.getElementById('end-turn');

endTurn.addEventListener('click', ()=>{
    socket.emit('play-game-spy', {roomname: roomname});
})

// Idle Display Elements.
const idleClue = document.getElementById('idle-clue');

function showStartDisplay(){
    displayStart.style.display = null;
    displayForm.style.display = "none";
    displayClue.style.display = "none";
    displayIdle.style.display = "none";
}

function showFormDisplay(){
    displayStart.style.display = "none";
    displayForm.style.display = null;
    displayClue.style.display = "none";
    displayIdle.style.display = "none";
}

function showClueDisplay(){
    displayStart.style.display = "none";
    displayForm.style.display = "none";
    displayClue.style.display = null;
    displayIdle.style.display = "none";
}

function showIdleDisplay(){
    displayStart.style.display = "none";
    displayForm.style.display = "none";
    displayClue.style.display = "none";
    displayIdle.style.display = null;
}

socket.on('reset-display', ()=>{
    receivedClue.innerHTML = "";
    idleClue.innerHTML = "";
    showStartDisplay();
})

socket.on('show-current-spy', (data)=>{
    receivedClue.innerHTML = "@";
    idleClue.innerHTML = "@";
    if (data.username === username){
        showFormDisplay();
    } else {
        showIdleDisplay();
    }
})

socket.on('show-current-operator', (data)=>{
    receivedClue.innerHTML = data.clue + ", " + data.number;
    idleClue.innerHTML = data.clue + ", " + data.number;
    if (data.username === username){
        showClueDisplay();
    } else {
        showIdleDisplay();
    }
})
