const board = document.getElementById('board');
const newGameBtn = document.getElementById('newgame');
const fieldOperator = document.getElementById('field');
const spyMaster = document.getElementById('spy');

// Build board buttons when a new user joins the room.
socket.on('board-game', (data) => {
    // Clear current board buttons, if any.
    board.innerHTML = "";
    parsedData = JSON.parse(data)
    parsedData.forEach(word => {
        board.appendChild(createButton(word));
    })
})

// Helper function to create buttons.
function createButton(word){
    var btn = document.createElement("button");
    btn.style.width = "18%";
    btn.style.height= "25%";
    btn.id = word[0];
    btn.className = "m-1 p-auto btn";
    btn.classList.add(word[1])
    var t = document.createTextNode(word[0]);
    btn.appendChild(t);
    return btn;
}

// Sending a message in the chat when a user clicks a button.
board.addEventListener('click', function(e){
    const text = e.target.id;
    console.log(text);
    output.innerHTML += '<p>--> <strong><em>' + username + ' </strong>clicked ' + text + '</em></p>';
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight
})

// Listening for new game request.
newGameBtn.addEventListener('click', () =>{
    socket.emit('new-game',{username: username, roomname: roomname});
})

spyMaster.addEventListener('click', ()=>{
    spyMaster.className = "btn btn-outline-primary active"
    fieldOperator.className = "btn btn-outline-primary"
})

fieldOperator.addEventListener('click', () =>{
    spyMaster.className = "btn btn-outline-primary"
    fieldOperator.className = "btn btn-outline-primary actve"
})

