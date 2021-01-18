// All 4 possible displays.
const displayStart = document.getElementById('display-start');
const displayForm = document.getElementById('display-form');
const displayClue = document.getElementById('display-clue');
const displayIdle = document.getElementById('display-idle');

// Start Display Elements.
const startgame = document.getElementById('start-game');

// Form Display Elements.
const sendClue = document.getElementById('sendin');
const clue = document.getElementById('clue');
const number = document.getElementById('number');

// Clue Display Elements.
const receivedClue = document.getElementById('received-clue');
const endTurn = document.getElementById('end-turn');

// Idle Display Elements.
const idleClue = document.getElementById('idle-clue');

function showStartDisplay(){
    displayStart.style.display = "block";
    displayForm.style.display = "none";
    displayClue.style.display = "none";
    displayIdle.style.display = "none";
}

function showFormDisplay(){
    displayStart.style.display = "none";
    displayForm.style.display = "block";
    displayClue.style.display = "none";
    displayIdle.style.display = "none";
}

function showClueDisplay(){
    displayStart.style.display = "none";
    displayForm.style.display = "none";
    displayClue.style.display = "block";
    displayIdle.style.display = "none";
}

function showIdleDisplay(){
    displayStart.style.display = "none";
    displayForm.style.display = "none";
    displayClue.style.display = "none";
    displayIdle.style.display = "block";
}

socket.on('reset-display', ()=>{
    showStartDisplay();
})

sendClue.addEventListener('click', ()=>{
    socket.emit('help', {roomname: roomname});
})