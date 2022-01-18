const board = document.getElementById('board');
const boardHeight = document.getElementById('height');
const newGameBtn = document.getElementById('newgame');
const confirmModal = document.getElementById('confirm');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');
const superhero = document.getElementById('super');
const sidekick = document.getElementById('side');
const redTeam = document.getElementById('red-team');
const blueTeam = document.getElementById('blue-team');

// Sound bite for clicking the cryptonight clue.
var explosion = new Audio('https://freesound.org/data/previews/156/156031_2703579-lq.mp3');

function linebreak() { return document.createElement('br'); }

/************************************************************************************
 *                              Build Board Buttons
 ***********************************************************************************/

/**
 * Begins a new board game for the players in the room.
 * Includes all the necessary set up:
 * 1) Reset or continue (if refreshed) all game settings 
 * 2) Display all buttons.
 * 
 */
socket.on('board-game', (data) => {
    // If the socket provides a username, only build board for that user.
    if (data.username && data.username !== username){
        return;
    }

    // If triggered by new game button, reset all game settings.
    if (data.new || (!isRefreshed() && data.username && data.username === username)){
        newGameSettings();
    }

    // Start session storage off at 'start'.
    if (!sessionStorage.getItem('display')){
        sessionStorage.setItem('display', 'start'); 
    }

    // Update role buttons.
    role = data.roles[username];
    if (role){
        changeToSidekick();
    } else {
        changeToSuperhero();
    }

    // Clear current board buttons, if any.
    board.innerHTML = "";

    // Determine if it is currently the players turn.
    var myturn = false;
    if (data.myturn && data.myturn === username){
        myturn = true;
    }

    // Create buttons.
    data.words.forEach(word => {
        board.appendChild(createButton(word, role, myturn));
    })

    // Update height for chinese words (special case)
    boardHeight.classList.remove('h-60');
    boardHeight.classList.remove('h-50');
    if (sessionStorage.getItem('word-set') === 'codewords-chinese') {
        boardHeight.classList.add('h-60');
    } else {
        boardHeight.classList.add('h-50');
    }

    // If refreshed, return to saved game state.
    console.log('when it matters: ', sessionStorage.getItem('restore'))
    if(isRefreshed()){
        returnToGameState();
    }
})

/**
 * Helper function to create board buttons.
 * 
 * @param {string} word The word to display
 * @param {boolean} role The role of the player (true for sidekick).
 * @param {boolean} myturn Whether or not it is the players turn
 */
function createButton(word, role, myturn){
    var btn = document.createElement("button");
    btn.style.width = "18%";
    btn.style.height= "18%";
    btn.id = word.text;
    btn.className = "m-1 p-auto btn";
    if (role || word.show){
        btn.classList.add(word.color);
        btn.disabled = true;
        if(word.color === buttonColor.BLACK){
            btn.innerHTML = icon("far fa-gem", "white");
        }
    } else if (myturn){
        btn.classList.add(buttonColor.GRAY)
        btn.disabled = false;
    } else {
        btn.classList.add(buttonColor.GRAY)
        btn.disabled = true;
    }

    if (word.show){
        // Update the board with border and icon when it has been clicked.
        btn.classList.add("border");
        btn.classList.add("border-dark");
        btn.style.setProperty("border-width", "thick", "important");
        if (btn.classList.contains(buttonColor.RED) || btn.classList.contains(buttonColor.BLUE)){
            btn.innerHTML = icon("fas fa-check-circle", "dark");
        } else if (btn.classList.contains(buttonColor.YELLOW)){
            btn.innerHTML = icon("fas fa-minus-circle", "dark");
        }
    }
    renderText(btn, word.text);
    return btn;
}

/**
 * Special case for '*' which is used to
 * demand a new line.
 * 
 * @param {HTMLButtonElement} btn
 * @param {string} text
 */
function renderText(btn, text) {
  const split = text.split('*');
  if (split.length > 1) {
    let first = document.createTextNode(split[0]);
    let second = document.createTextNode(split[1]);
    btn.appendChild(first);
    btn.appendChild(linebreak());
    btn.appendChild(second);
  } else {
    btn.appendChild(document.createTextNode(text));
  }
}

/**
 * Check if current board game call is due to a refreshed player.
 */
function isRefreshed(){
    return sessionStorage.getItem('restore') === '1';
}

/**
 * Helper function to create HTML for a font-awesome icon
 * 
 * @param {string} name Name of the icon (i.e. "fa fa-icon")
 * @param {string} color Color of the text
 */
function icon(name, color){
    return `<span class="text-${color}">
        <i class="${name}"></i>
        </span>`
}

/**
 * Resets game to original settings and stores necessary info in session storage.
 */
function newGameSettings(){
    turnBroadcast.style.display = "none";
    unlockTeams();
    unlockRoles();
    resetTurns();
    endTimer();
    setTime();
    setWordSet();
    showSettings();
    updateRedScore("9");
    updateBlueScore("8");
    sessionStorage.removeItem('broadcast-msg');
    sessionStorage.removeItem('broadcast-color');
    sessionStorage.removeItem('time');
    sessionStorage.removeItem('time-for');
    sessionStorage.removeItem('last-click');
    sessionStorage.setItem('game-in-progress', 'false');
}

/************************************************************************************
 *                              Clicking Board Buttons
 ***********************************************************************************/

/**
 * Perform necessary actions when user presses a button.
 * 1) Update database to show the word.
 * 2) Find the word to determine its color.
 * 3) Send a message in the chat.
 * 4) Update statistics.
 */
board.addEventListener('click', function(e){
    const text = e.target.id;
    // Make sure that no double clicking happened.
    if (text !== "board" && sessionStorage.getItem('last-click') !== text){
        // Record the click in session storage.
        sessionStorage.setItem('last-click', text);

        // Update database to show item.
        socket.emit('show-word', {
            roomname: roomname,
            word: text,
            myturn: username,
        })

        // Find word in database.
        // Result is sent to socket.on('found-word')
        socket.emit('find-word', {
            roomname: roomname,
            username: username,
            word: text,
        })

        // Message chat with current move.
        socket.emit('chat', {
            username: username,
            roomname: roomname,
            message: text,
            event: "button",
        });

        // Update number of button clicks per turn
        sessionStorage.setItem('button-count', String(Number(sessionStorage.getItem('button-count'))+1));
    }
})

const buttonColor = {
    BLUE: 'btn-primary',
    GRAY: 'btn-secondary',
    RED: 'btn-danger',
    BLACK: 'btn-success',
    YELLOW: 'btn-warning'
}

/**
 * Called after "socket.emit("find-word"), after the socket retrieves the information needed.
 * Performs actions based on the color of the word and keeps track of statistics.
 */
socket.on('found-word', (data) => {
    // Find elapsed time, necessary if game is over.
    const startTime = sessionStorage.getItem('start-time') || "60";
    const elapsedTime = Number(startTime)-Number(counter.innerHTML);

    const teamColor = data.color;
    const color = data.wordButton.color;
    
    let redScore = data.redScore;
    let blueScore = data.blueScore;

    if (color === buttonColor.BLACK){
        // Update to show cryptonight clue hit
        sessionStorage.setItem('cryptonight', '1');

        // Game is over, other team wins.
        if (teamColor === "red"){
            blueScore = "0";
        } else {
            redScore = "0";
        }

        // When green button is clicked, everyone hears explosion sound.
        explosion.play();
    } else if (color === buttonColor.RED){        
        // If color does not match team color, turn is over.
        if (teamColor !== "red" && data.username === username){

            // Update to show cryptonight clue hit
            sessionStorage.setItem('wrong', '1');

            socket.emit('turn-over', {
                roomname: roomname,
                username: username,
            });
        }
    } else if (color === buttonColor.BLUE){
        // If color does not match team color, turn is over
        if (teamColor !== "blue" && data.username === username){
            // Update to show cryptonight clue hit
            sessionStorage.setItem('wrong', '1');

            socket.emit('turn-over', {
                roomname: roomname,
                username: username,
            });
        }
    } else {
        if (data.username === username){
            // Update to show cryptonight clue hit
            sessionStorage.setItem('yellow', '1');

            // Yellow button indicates turn is over.
            socket.emit('turn-over', {
                roomname: roomname,
                username: username,
            });
        }
    }

    // calculate scores after this move
    updateRedScore(redScore);
    updateBlueScore(blueScore);

    // Game is over
    if ((blueScore == 0 || redScore == 0) && data.username === username){
      gameOverActions(elapsedTime, redScore, blueScore);
    }
})

/**
 * Helper function for sending message when a game is finished.
 * 
 * @param {number} elapsedTime The amount of time the turn took.
 * @param {string} redScore Red team score.
 * @param {string} blueScore Blue team score.
 */
function gameOverActions(elapsedTime, redScore, blueScore) {
    const winner =  redScore < blueScore ? 'red' : 'blue'; 
    showIdleDisplay();
    socket.emit('game-over', {
        roomname: roomname,
        username: username,
        time: elapsedTime,
        buttonCount: Number(sessionStorage.getItem('button-count')),
        cryptonight: Number(sessionStorage.getItem('cryptonight')),
        wrong: Number(sessionStorage.getItem('wrong')),
        yellow: Number(sessionStorage.getItem('yellow')),
        winner: winner,
        redScore: redScore,
        blueScore: blueScore,
    });
}

function updateBlueScore(score){
    blueTeam.innerHTML = `Blue Team: ${score}`;
    sessionStorage.setItem('bluescore', score);
}

function updateRedScore(score){
    redTeam.innerHTML = `Red Team: ${score}`;
    sessionStorage.setItem('redscore', score);
}

/************************************************************************************
 *                              Helper Functions for Setting Controls
 ***********************************************************************************/

function changeToSidekick(){
    sidekick.classList.add("active");
    superhero.classList.remove("active");
}

function changeToSuperhero(){
    sidekick.classList.remove("active");
    superhero.classList.add("active");
}

function sidekickEventHandler() {
    changeToSidekick();
    socket.emit('role-change-sidekick', {
        username: username, 
        roomname: roomname
    });
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: 'sidekick',
        event: 'switch'
    });
}

function superheroEventHandler(){
    changeToSuperhero();
    socket.emit('role-change-superhero', {
        username: username, 
        roomname: roomname
    });
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: 'superhero',
        event: 'switch'
    });
}

function unlockRoles(){
    // Change role to sidekick.
    sidekick.addEventListener('click', sidekickEventHandler);

    // Change role to superhero.
    superhero.addEventListener('click', superheroEventHandler);

    sidekick.classList.remove('disabled');
    superhero.classList.remove('disabled');
}

function unlockTeams(){
    const userCard = document.getElementById(username);
    if(userCard){
        userCard.classList.remove("filtered")
    };
}

function resetTurns(){
    socket.emit('reset-turns', {
        roomname: roomname,
    });
}

// Listening for new game request.
newGameBtn.addEventListener('click', () => {
    // ask for confirmation if a game is in progress
    console.log('newg', sessionStorage.getItem('game-in-progress'));
    if (sessionStorage.getItem('game-in-progress') === 'true'){
      openModal(confirmModal);
    } else {
      createNewGame();
    }
});

confirmCancel.addEventListener('click', () => {
    closeModal(confirmModal);
});

confirmOk.addEventListener('click', () => {
    closeModal(confirmModal);
    createNewGame();
});

function createNewGame() {
    socket.emit('new-game',{
      username: username, 
      roomname: roomname,
    });
}

function openModal(elem) {
    elem.style.display="block";
}

function closeModal(elem) {
    elem.style.display="none";
} 



