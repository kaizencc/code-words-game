const board = document.getElementById('board');
const newGameBtn = document.getElementById('newgame');
const fieldOperator = document.getElementById('field');
const spyMaster = document.getElementById('spy');

// Build board buttons when a new user joins the room.
socket.on('board-game', (data) => {
    role = data.roles[username]
    // Clear current board buttons, if any.
    board.innerHTML = "";
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
    if (role){
        btn.classList.add(word.color);
    } else {
        btn.classList.add("btn-secondary")
    }
    var t = document.createTextNode(word.text);
    btn.appendChild(t);
    return btn;
}

// Sending a message in the chat when a user clicks a button.
board.addEventListener('click', function(e){
    const text = e.target.id;
    console.log(text);
    socket.emit('chat', {
        username: username,
        roomname: roomname,
        message: text,
        button: true,
    });
})

// Listening for new game request.
newGameBtn.addEventListener('click', () =>{
    socket.emit('new-game',{username: username, roomname: roomname});
})

spyMaster.addEventListener('click', ()=>{
    spyMaster.className = "btn btn-outline-primary active";
    fieldOperator.className = "btn btn-outline-primary";
    socket.emit('role-change-spy', {username: username, roomname: roomname});
})

fieldOperator.addEventListener('click', () =>{
    spyMaster.className = "btn btn-outline-primary";
    fieldOperator.className = "btn btn-outline-primary active";
    socket.emit('role-change-field', {username: username, roomname: roomname});
})

