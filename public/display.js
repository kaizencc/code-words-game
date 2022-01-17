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
const randomizeBtn = document.getElementById('set3');

randomizeBtn.addEventListener('click', ()=> {
    checkConditions("randomize");
})

/**
 * when start game button is clicked, there is a 3 step verification cascade to validate game conditions.
 * Each step needs to communicate with the server which in turn sends the return data to a new socket function.
 */
startGameBtn.addEventListener('click', ()=>{
    console.log('game started');
    // Authenticate current game conditions.
    checkConditions("start");
})

/**
 * step 1: Check to see if room has 4 players.
 */
function checkConditions(situation){
    console.log('checking conditions');
    socket.emit('ensure-four-players', {
        roomname: roomname, 
        username: username,
        situation: situation,
    });
}

/**
 * Step 2: If room has 4 players, ensure that all 4 roles are occupied.
 */
socket.on('ensure-four-players', (data)=>{
    if (data.username === username){
        console.log('ensure 4 players');
        console.log(data.good);
        if (data.good){
            if (data.situation === "randomize"){
                // Randomize button was pressed
                socket.emit('randomize-teams-and-roles', {
                    roomname: roomname,
                    username: username,
                })
            } else {
                socket.emit('ensure-all-roles', {
                    roomname: roomname,
                    username: username,
                });
            }
        } else {
            alert("You do not have 4 players in the room yet.");
        }
    }
})

/**
 * Step 3: If all 4 roles are occupied, start game.
 */
socket.on('ensure-all-roles', (data) => {
    if (data.username === username){
        console.log('ensure all roles');
        console.log(data.good);
        if (data.good){
            broadcastStartGame();
        } else {
            // Message chat with the current roles of each player.
            socket.emit('chat', {
                roomname: roomname,
                message: data.users,
                event: "all-roles",
            });
            alert("All 4 roles are not occupied yet.");
        }
    }
})

/**
 * Broadcasts to the rest of the room that the game has started.
 * Locks all variables and removes settings from the display.
 */
function broadcastStartGame(){
    // Lock role changes and team changes.
    socket.emit('lock-variables', {
        roomname: roomname,
    });
    // Begin game.
    socket.emit('play-game-sidekick', {
        roomname: roomname,
    });
}

/**
 * Lock (or hide) all game settings once game has started.
 */
socket.on('lock-variables', () => {
    sessionStorage.setItem('game-in-progress', 'true');
    console.log(sessionStorage.getItem('game-in-progress'));
    lockRoles();
    lockTeams();
    hideSettings();
})

function lockTeams(){
    const userCard = document.getElementById(username);
    userCard.classList.add("filtered");
}

function lockRoles(){
    // Remove event listeners.
    sidekick.removeEventListener('click', sidekickEventHandler);
    superhero.removeEventListener('click', superheroEventHandler);

    // Disable buttons
    sidekick.classList.add('disabled');
    superhero.classList.add('disabled');

}

/************************************************************************************
 *                              sidekick Display Elements
 ***********************************************************************************/

const sendClueBtn = document.getElementById('sendin');
const clue = document.getElementById('clue');
const number = document.getElementById('number');

/**
 * When the send clue button is clicked, the sidekick turn is finished.
 */
sendClueBtn.addEventListener('click', () => {
    // Make sure number is valid.
    if (checkNumber()){
        sidekickTurnFinished();
    }
})

/**
 * If time runs out, the server will end the sidekicks turn before the send clue button is clicked.
 */
socket.on('sidekick-turn-over', (data) => {
    if (data.username === username){
        sidekickTurnFinished();
    }
})

/**
 * Tells the server to go on to the next turn, and sends message in the chat.
 */
function sidekickTurnFinished(){
    // Find total time spent
    const startTime = sessionStorage.getItem('start-time') || "60";
    const elapsedTime = Number(startTime)-Number(counter.innerHTML);

    socket.emit('play-game-superhero', {
        roomname: roomname,
        username: username,
        time: elapsedTime,
        clue: clue.value,
        number: number.value,
    });

    // Message chat with current move.
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: `${clue.value}, ${number.value}`,
        event: "clue",
    });

    // Empty values.
    number.value = "";
    clue.value = "";
}

/**
 * Ensure that a number is sent in the clue # box.
 */
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
 *                           Superhero Display Elements
 ***********************************************************************************/

const receivedClue = document.getElementById('received-clue');
const endTurnBtn = document.getElementById('end-turn');

/**
 * End turn when the 'end turn' button is clicked.
 */
endTurnBtn.addEventListener('click', () => {
    superheroTurnFinished();
})

/**
 * The server may end a turn before the 'end turn' button is clicked, for example when a wrong button is clicked.
 */
socket.on('turn-over', (data) => {
    if (data.username === username){
        superheroTurnFinished();
    }
})

/**
 * When the superhero turn is finished, tell the server to move on to next turn.
 */
function superheroTurnFinished(){
    // Determine amount of time spent.
    const startTime = sessionStorage.getItem('start-time') || "60";
    const elapsedTime = Number(startTime)-Number(counter.innerHTML);

    turnOffButtons();
    socket.emit('play-game-sidekick', {
        roomname: roomname,
        username: username,
        time: elapsedTime,
        buttonCount: Number(sessionStorage.getItem('button-count')),
        cryptonight: Number(sessionStorage.getItem('cryptonight')),
        wrong: Number(sessionStorage.getItem('wrong')),
        yellow: Number(sessionStorage.getItem('yellow')),
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

/**
 * Show the display necessary when it is a sidekick's turn.
 */
socket.on('show-current-sidekick', (data)=>{
    clock(data.username, data.time);

    setReceivedClue("");
    setIdleClue("");
    if (data.username === username){
        showFormDisplay();
        //startSidekickStorageClickStats();
        broadcastYourTurn(data.turn);
    } else {
        turnOffButtons();
        showIdleDisplay();
        if (data.turn){
            broadcastTurn("Red Sidekick's turn", data.turn);
        } else {
            broadcastTurn("Blue Sidekick's turn", data.turn)
        }
    }
})

/**
 * Show the display necessary when it is a superhero's turn.
 */
socket.on('show-current-superhero', (data)=>{
    clock(data.username, data.time);
    if (data.username === username){
        turnOnButtons();
        showClueDisplay();
        startSuperheroStorageClickStats();
        broadcastYourTurn(data.turn);
    } else {
        turnOffButtons();
        showIdleDisplay();
        if (data.turn){
            broadcastTurn("Red Superhero's turn", data.turn);
        } else {
            broadcastTurn("Blue Superhero's turn", data.turn)
        }
    }
    setReceivedClue(data.clue + ", " + data.number);
    setIdleClue(data.clue + ", " + data.number);
})

/************************************************************************************
 *                              Clue Helper Functions
 ***********************************************************************************/

/**
 * Reset all session storage elements that keep track of statistics.
 */
function startSuperheroStorageClickStats(){
    sessionStorage.setItem('button-count','0');
    sessionStorage.setItem('cryptonight','0');
    sessionStorage.setItem('wrong','0');
    sessionStorage.setItem('yellow','0');
}

function setReceivedClue(text){
    changeClueColor(receivedClue, sessionStorage.getItem('broadcast-color'));
    receivedClue.innerHTML = text;
    sessionStorage.setItem('received-clue', text);
}

function setIdleClue(text){
    changeClueColor(idleClue, sessionStorage.getItem('broadcast-color'));
    idleClue.innerHTML = text;
    sessionStorage.setItem('idle-clue', text);
}

function changeClueColor(element, color){
    if (color == "red"){
        element.classList.remove("text-primary");
        element.classList.add("text-danger");
    } else {
        element.classList.remove("text-danger");
        element.classList.add("text-primary");        
    }
}

/************************************************************************************
 *                              Broadcast Helper Functions
 ***********************************************************************************/

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

