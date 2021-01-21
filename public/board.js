const board = document.getElementById('board');
const newGameBtn = document.getElementById('newgame');
const fieldOperator = document.getElementById('field');
const spyMaster = document.getElementById('spy');
const redTeam = document.getElementById('red-team');
const blueTeam = document.getElementById('blue-team');

/************************************************************************************
 *                              Build Board Buttons
 ***********************************************************************************/

// Build board buttons when a new user joins the room.
socket.on('board-game', (data) => {
    // Build board triggered by new game button.
    if (data.new){
        turnBroadcast.style.display = "none";
        unlockTeams();
        unlockRoles();
        resetTurns();
        endTimer();
        redTeam.innerHTML = String(9);
        blueTeam.innerHTML = String(8);
    }

    // Update role buttons.
    role = data.roles[username]
    if (role){
        changeToSpyMaster();
    } else {
        changeToFieldOperator();
    }

    // Clear current board buttons, if any.
    board.innerHTML = "";

    var myturn = false;
    if (data.myturn && data.myturn === username){
        myturn = true;
    }

    // Create buttons.
    data.words.forEach(word => {
        board.appendChild(createButton(word, role, myturn));
    })
})

// Helper function to create buttons.
function createButton(word, role, myturn){
    var btn = document.createElement("button");
    btn.style.width = "18%";
    btn.style.height= "18%";
    btn.id = word.text;
    btn.className = "m-1 p-auto btn";
    if (role || word.show){
        btn.classList.add(word.color);
        btn.disabled = true;
    } else if (myturn){
        btn.classList.add(buttonColor.GRAY)
        btn.disabled = false;
    } else {
        btn.classList.add(buttonColor.GRAY)
        btn.disabled = true;
    }
    var t = document.createTextNode(word.text);
    btn.appendChild(t);
    return btn;
}

/************************************************************************************
 *                              Clicking Board Buttons
 ***********************************************************************************/


// Sending a message in the chat when a user clicks a button.
board.addEventListener('click', function(e){
    const text = e.target.id;
    if (text !== "board"){
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
    }
})

const buttonColor = {
    BLUE: 'btn-primary',
    GRAY: 'btn-outline-secondary',
    RED: 'btn-danger',
    BLACK: 'btn-dark',
    YELLOW: 'btn-warning'
}

socket.on('found-word', (data) => {
    // Find elapsed time, necessary if game is over.
    const elapsedTime = 60-Number(counter.innerHTML);

    const teamColor = data.color;
    // Change score if necessary.
    const color = data.wordButton.color;
    console.log(color);
    if (color === buttonColor.BLACK){
        // Game is over, other team wins.
        var winningTeam = "";
        var finalRedScore = "";
        var finalBlueScore = "";
        if (teamColor === "red"){
            winningTeam = "blue";
            finalBlueScore = "0";
            blueTeam.innerHTML = "0";
            finalRedScore = redTeam.innerHTML;
        } else {
            winningTeam = "red";
            finalRedScore = "0";
            redTeam.innerHTML = "0";
            finalBlueScore = blueTeam.innerHTML;
        }

        if (data.username === username){
            socket.emit('game-over', {
                roomname: roomname,
                username: username,
                time: elapsedTime,
                winner: winningTeam,
                redScore: finalRedScore,
                blueScore: finalBlueScore,
            });
        }

    } else if (color === buttonColor.RED){
        redScore = Number(redTeam.innerHTML);
        
        // If color does not match team color, turn is over.
        if (teamColor !== "red" && data.username === username){
            socket.emit('turn-over', {
                roomname: roomname,
                username, username,
            });
        }

        // Game is over, red team wins.
        if (redScore == 1 && data.username === username){
            socket.emit('game-over', {
                roomname: roomname,
                username: username,
                time: elapsedTime,
                winner: "red",
                redScore: "0",
                blueScore: blueTeam.innerHTML,
            });
        }

        // Red team subtracts a point
        redTeam.innerHTML = String(redScore-1);
    } else if (color === buttonColor.BLUE){
        blueScore = Number(blueTeam.innerHTML);

        // If color does not match team color, turn is over
        if (teamColor !== "blue" && data.username === username){
            socket.emit('turn-over', {
                roomname: roomname,
                username, username,
            });
        }

        // Game is over
        if (blueScore == 1 && data.username === username){
            socket.emit('game-over', {
                roomname: roomname,
                username: username,
                time: elapsedTime,
                winner: "blue",
                redScore: redTeam.innerHTML,
                blueScore: "0",
            });
        }

        // Blue team subtracts a point
        blueTeam.innerHTML = String(blueScore-1);
    } else {
        if (data.username === username){
            // Yellow button indicates turn is over.
            socket.emit('turn-over', {
                roomname: roomname,
                username, username,
            });
        }
    }
})

/************************************************************************************
 *                              Switch Role Radio Buttons
 ***********************************************************************************/

// Helper functions to change HTML buttons.
function changeToSpyMaster(){
    spyMaster.classList.add("active");
    fieldOperator.classList.remove("active");
}

function changeToFieldOperator(){
    spyMaster.classList.remove("active");
    fieldOperator.classList.add("active");
}

function spyEventHandler() {
    changeToSpyMaster();
    socket.emit('role-change-spy', {
        username: username, 
        roomname: roomname
    });
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: 'spymaster',
        event: 'switch'
    });
}

function fieldEventHandler(){
    console.log('heloooo');
    changeToFieldOperator();
    socket.emit('role-change-field', {
        username: username, 
        roomname: roomname
    });
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: 'field operator',
        event: 'switch'
    });
}

function unlockRoles(){
    // Change role to spymaster.
    spyMaster.addEventListener('click', spyEventHandler);

    // Change role to field operator.
    fieldOperator.addEventListener('click', fieldEventHandler);

    spyMaster.classList.remove('disabled');
    fieldOperator.classList.remove('disabled');
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
