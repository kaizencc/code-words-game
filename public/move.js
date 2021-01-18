// All 4 possible displays.
const displayStart = document.getElementById('display-start');
const displayForm = document.getElementById('display-form');
const displayClue = document.getElementById('display-clue');
const displayIdle = document.getElementById('display-idle');

// Start Display Elements.
const startgame = document.getElementById('start-game');

startgame.addEventListener('click', ()=>{
    console.log('game started');
    // Authenticate current game conditions.
    checkConditions();
})

function checkConditions(){
    console.log('checking conditions');
    socket.emit('ensure-four-players', {
        roomname: roomname, 
        username: username,
    });
}

socket.on('ensure-four-players', (data)=>{
    if (data.username === username){
        console.log('ensure 4 players');
        console.log(data.good);
        if (data.good){
            socket.emit('ensure-all-roles', {
                roomname: roomname,
                username: username,
            });
        } else {
            alert("You do not have 4 players in the room yet.");
        }
    }
})

socket.on('ensure-all-roles', (data) => {
    if (data.username === username){
        console.log('ensure all roles');
        console.log(data.good);
        if (data.good){
            // TODO: Lock roles and teams.
            socket.emit('play-game-spy', {roomname: roomname});
        } else {
            alert("All 4 roles are not occupied yet.");
        }
    }
})

// Form Display Elements.
const sendClue = document.getElementById('sendin');
const clue = document.getElementById('clue');
const number = document.getElementById('number');

sendClue.addEventListener('click', ()=>{
    // Make sure number is valid.
    if (checkNumber()){
        socket.emit('play-game-operator', {
            roomname: roomname,
            clue: clue.value,
            number: number.value,
        });
    
        // Empty values.
        number.value = "";
        clue.value = "";
    }
})

function checkNumber() {
    var x= number.value;
    var regex=/^[0-9]+$/;
    if (!x.match(regex)){
        alert("Must input number in second box");
        return false;
    }
    return true;
}

// Clue Display Elements.
const receivedClue = document.getElementById('received-clue');
const endTurn = document.getElementById('end-turn');

endTurn.addEventListener('click', ()=>{
    turnOffButtons();
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

function turnOffButtons(){
    buttons = board.children;
    console.log(buttons.length);
    for (var i=0; i< buttons.length; i++){
        buttons[i].disabled = true;
    }
}

function turnOnButtons(){
    buttons = board.children;
    console.log(buttons.length);
    for (var i=0; i< buttons.length; i++){
        if(buttons[i].classList.contains(buttonColor.GRAY)){
            buttons[i].disabled = false;
        }
    }
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
        turnOnButtons();
        showClueDisplay();
    } else {
        showIdleDisplay();
    }
})
