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
            socket.emit('lock-variables', {
                roomname: roomname,
            });
            // Begin game.
            socket.emit('play-game-spy', {
                roomname: roomname,
            });
        } else {
            alert("All 4 roles are not occupied yet.");
        }
    }
})

socket.on('lock-variables', () => {
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
 *                              Spymaster Display Elements
 ***********************************************************************************/

const sendClueBtn = document.getElementById('sendin');
const clue = document.getElementById('clue');
const number = document.getElementById('number');

sendClueBtn.addEventListener('click', () => {
    // Make sure number is valid.
    if (checkNumber()){
        spyTurnFinished();
    }
})

function spyTurnFinished(){
    // Find total time spent
    const elapsedTime = 60-Number(counter.innerHTML);

    socket.emit('play-game-operator', {
        roomname: roomname,
        username: username,
        time: elapsedTime,
        clue: clue.value,
        number: number.value,
    });

    // Empty values.
    number.value = "";
    clue.value = "";
}

socket.on('spy-turn-over', (data) => {
    if (data.username === username){
        spyTurnFinished();
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
 *                           Field Operator Display Elements
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
    // Determine amount of time spent.
    const elapsedTime = 60-Number(counter.innerHTML);

    turnOffButtons();
    socket.emit('play-game-spy', {
        roomname: roomname,
        username: username,
        time: elapsedTime,
    });
}

/************************************************************************************
 *                              Idle Display Elements
 ***********************************************************************************/

const idleClue = document.getElementById('idle-clue');

/************************************************************************************
 *                              Gameplay Helper Functions
 ***********************************************************************************/


function showStartDisplay(){
    sessionStorage.setItem('display','start');
    displayStart.style.display = null;
    displayForm.style.display = "none";
    displayClue.style.display = "none";
    displayIdle.style.display = "none";
}

function showFormDisplay(){
    sessionStorage.setItem('display','form');
    displayStart.style.display = "none";
    displayForm.style.display = null;
    displayClue.style.display = "none";
    displayIdle.style.display = "none";
}

function showClueDisplay(){
    sessionStorage.setItem('display','clue');
    displayStart.style.display = "none";
    displayForm.style.display = "none";
    displayClue.style.display = null;
    displayIdle.style.display = "none";
}

function showIdleDisplay(){
    sessionStorage.setItem('display','idle');
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

/************************************************************************************
 *                              Gameplay Socket Communications
 ***********************************************************************************/


socket.on('reset-display', ()=>{
    setReceivedClue("");
    setIdleClue("");
    showStartDisplay();
})

socket.on('show-current-spy', (data)=>{
    clock(data.username);

    setReceivedClue("");
    setIdleClue("");
    if (data.username === username){
        showFormDisplay();
        broadcastYourTurn(data.turn);
    } else {
        turnOffButtons();
        showIdleDisplay();
        if (data.turn){
            broadcastTurn("Red Spymaster's turn", data.turn);
        } else {
            broadcastTurn("Blue Spymaster's turn", data.turn)
        }
    }
})

socket.on('show-current-operator', (data)=>{
    clock(data.username);

    setReceivedClue(data.clue + ", " + data.number);
    setIdleClue(data.clue + ", " + data.number);
    if (data.username === username){
        turnOnButtons();
        showClueDisplay();
        broadcastYourTurn(data.turn);
    } else {
        turnOffButtons();
        showIdleDisplay();
        if (data.turn){
            broadcastTurn("Red Operator's turn", data.turn);
        } else {
            broadcastTurn("Blue Operator's turn", data.turn)
        }
    }
})

function setReceivedClue(text){
    receivedClue.innerHTML = text;
    sessionStorage.setItem('received-clue', text);
}

function setIdleClue(text){
    idleClue.innerHTML = text;
    sessionStorage.setItem('idle-clue', text);
}

function broadcastTurn(text, turn){
    changeBroadcast(text, null);
    if (turn){
        makeBroadcastRed();
    } else {
        makeBroadcastBlue();
    }
}

function broadcastYourTurn(turn){
    changeBroadcast("Your Turn", null);
    if (turn){
        makeBroadcastRed();
    } else {
        makeBroadcastBlue();
    }
}

function makeBroadcastRed(){
    turnBroadcast.classList.remove("alert-primary");
    turnBroadcast.classList.add("alert-danger");
    sessionStorage.setItem('broadcast-color','red');
}

function makeBroadcastBlue(){
    turnBroadcast.classList.remove("alert-danger");
    turnBroadcast.classList.add("alert-primary");
    sessionStorage.setItem('broadcast-color','blue');
}

function changeBroadcast(message, display){
    turnBroadcast.innerHTML = message;
    turnBroadcast.style.display = display;
    sessionStorage.setItem('broadcast-msg', message);
}
