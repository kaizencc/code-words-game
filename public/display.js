const turnBroadcast = document.getElementById('broadcast-turn');

// All 4 possible displays.
const displayStart = document.getElementById('display-start');
const displayForm = document.getElementById('display-form');
const displayClue = document.getElementById('display-clue');
const displayIdle = document.getElementById('display-idle');

/************************************************************************************
 *                              Start Display Elements
 ***********************************************************************************/

const startGameBtn = document.getElementById('start-game');

// On click, start 3-step cascade to validate conditions before beginning game.
startGameBtn.addEventListener('click', ()=>{
    console.log('game started');
    // Authenticate current game conditions.
    checkConditions();
})

// Step 1: Communicate with socket to ensure that there are 4 players.
function checkConditions(){
    console.log('checking conditions');
    socket.emit('ensure-four-players', {
        roomname: roomname, 
        username: username,
    });
}

// Step 2: Receive answer and if valid, ensure that all roles are set.
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

// Step 3: Receive answer and start game if valid.
socket.on('ensure-all-roles', (data) => {
    if (data.username === username){
        console.log('ensure all roles');
        console.log(data.good);
        if (data.good){
            // Lock role changes and team changes.
            socket.emit('lock-variables', {roomname: roomname});
            // Begin game.
            socket.emit('play-game-spy', {roomname: roomname});
        } else {
            alert("All 4 roles are not occupied yet.");
        }
    }
})

socket.on('lock-variables', (data) => {
    lockRoles();
    lockTeams();
})

function lockTeams(){
    const userCard = document.getElementById(username);
    userCard.classList.add("filtered");
}

function lockRoles(){
    // Remove event listeners.
    spyMaster.removeEventListener('click', spyEventHandler);
    fieldOperator.removeEventListener('click', fieldEventHandler);

    // Disable buttons
    spyMaster.classList.add('disabled');
    fieldOperator.classList.add('disabled');

}

/************************************************************************************
 *                              Clue Form Display Elements
 ***********************************************************************************/

const sendClueBtn = document.getElementById('sendin');
const clue = document.getElementById('clue');
const number = document.getElementById('number');

sendClueBtn.addEventListener('click', () => {
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

/************************************************************************************
 *                           Received Clue Display Elements
 ***********************************************************************************/

const receivedClue = document.getElementById('received-clue');
const endTurnBtn = document.getElementById('end-turn');

// If user clicks end turn.
endTurnBtn.addEventListener('click', () => {
    turnFinished();
})

// Called if user clicks a wrong color button.
socket.on('turn-over', (data) => {
    if (data.username === username){
        turnFinished();
    }
})

function turnFinished(){
    turnOffButtons();
    socket.emit('play-game-spy', {roomname: roomname});
}

/************************************************************************************
 *                              Idle Display Elements
 ***********************************************************************************/

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
        broadcastYourTurn(data.turn);
    } else {
        showIdleDisplay();
        if (data.turn){
            broadcastTurn("Red Spymaster's turn", data.turn);
        } else {
            broadcastTurn("Blue Spymaster's turn", data.turn)
        }
    }
})

socket.on('show-current-operator', (data)=>{
    receivedClue.innerHTML = data.clue + ", " + data.number;
    idleClue.innerHTML = data.clue + ", " + data.number;
    if (data.username === username){
        turnOnButtons();
        showClueDisplay();
        broadcastYourTurn(data.turn);
    } else {
        showIdleDisplay();
        if (data.turn){
            broadcastTurn("Red Operator's turn", data.turn);
        } else {
            broadcastTurn("Blue Operator's turn", data.turn)
        }
    }
})

function broadcastTurn(text, turn){
    turnBroadcast.innerHTML = text;
    turnBroadcast.style.display = null;
    if (turn){
        makeBroadcastRed();
    } else {
        makeBroadcastBlue();
    }
}

function broadcastYourTurn(turn){
    turnBroadcast.innerHTML = "Your Turn";
    turnBroadcast.style.display = null;
    if (turn){
        makeBroadcastRed();
    } else {
        makeBroadcastBlue();
    }
}

function makeBroadcastRed(){
    turnBroadcast.classList.remove("alert-primary");
    turnBroadcast.classList.add("alert-danger");
}

function makeBroadcastBlue(){
    turnBroadcast.classList.remove("alert-danger");
    turnBroadcast.classList.add("alert-primary");
}
