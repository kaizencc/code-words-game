const board = document.getElementById('board');
const newGameBtn = document.getElementById('newgame');
const fieldOperator = document.getElementById('field');
const spyMaster = document.getElementById('spy');
const redTeam = document.getElementById('red-team');
const blueTeam = document.getElementById('blue-team');

// Build board buttons when a new user joins the room.
socket.on('board-game', (data) => {
    // Update role buttons.
    role = data.roles[username]
    if (role){
        changeToSpyMaster();
    } else {
        changeToFieldOperator();
    }

    // Clear current board buttons, if any.
    board.innerHTML = "";

    // Create buttons.
    data.words.forEach(word => {
        board.appendChild(createButton(word, role));
    })
})

// Helper function to create buttons.
function createButton(word, role){
    var btn = document.createElement("button");
    btn.style.width = "18%";
    btn.style.height= "25%";
    btn.id = word.text;
    btn.className = "m-1 p-auto btn";
    if (role || word.show){
        btn.classList.add(word.color);
        btn.disabled = true;
    } else {
        btn.classList.add("btn-secondary")
        btn.disabled = false;
    }
    var t = document.createTextNode(word.text);
    btn.appendChild(t);
    return btn;
}

// Sending a message in the chat when a user clicks a button.
board.addEventListener('click', function(e){
    const text = e.target.id;
    // Find word in database.
    // Result is sent to socket.on('found-word')
    socket.emit('find-word', {
        roomname: roomname,
        word: text,
    })

    // Update database to show item.
    socket.emit('show-word', {
        roomname: roomname,
        word: text,
    })

    // Message chat with current move.
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: text,
        event: "button",
    });
})

const buttonColor = {
    BLUE: 'btn-primary',
    GRAY: 'btn-secondary',
    RED: 'btn-danger',
    BLACK: 'btn-dark',
    YELLOW: 'btn-warning'
}

socket.on('found-word', (data) => {
    // Change score if necessary.
    console.log("hereeeee");
    const color = data.data.color;
    console.log(color);
    if (color === buttonColor.BLACK){
        // Game is over
        console.log("black");
        endGame();
    } else if (color === buttonColor.RED){
        // Red team subtracts a point
        console.log("red");
        redScore = Number(redTeam.innerHTML);
        redTeam.innerHTML = String(redScore-1);
    } else if (color === buttonColor.BLUE){
        // Blue team subtracts a point
        console.log("blue");
        blueScore = Number(blueTeam.innerHTML);
        blueTeam.innerHTML = String(blueScore-1);
    }
})

function endGame(){
    console.log("game over");
    $("#myModal").modal("show").on('shown.bs.modal', function () {
        $(".modal").css('display', 'block');
    })
}   

// Listening for new game request.
newGameBtn.addEventListener('click', () =>{
    socket.emit('new-game',{username: username, roomname: roomname});
})

// Helper functions to change HTML buttons.
function changeToSpyMaster(){
    spyMaster.className = "btn btn-outline-primary active";
    fieldOperator.className = "btn btn-outline-primary";
}

function changeToFieldOperator(){
    spyMaster.className = "btn btn-outline-primary";
    fieldOperator.className = "btn btn-outline-primary active";
}

// Change role to spymaster.
spyMaster.addEventListener('click', ()=>{
    changeToSpyMaster();
    socket.emit('role-change-spy', {username: username, roomname: roomname});
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: 'spymaster',
        event: 'switch'
    });
})

// Change role to field operator.
fieldOperator.addEventListener('click', () =>{
    changeToFieldOperator();
    socket.emit('role-change-field', {username: username, roomname: roomname});
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: 'field operator',
        event: 'switch'
    });
})

