const board = document.getElementById('board');

// Build board buttons when a new user joins the room.
socket.on('board-game', (data) => {
    // Clear current board buttons, if any.
    board.innerHTML = "";
    parsedData = JSON.parse(data)
    parsedData.forEach(word => {
        board.appendChild(createButton(word));
    })
})

// Helper function to create buttons
function createButton(word){
    var btn = document.createElement("button");
    btn.style.width = "18%";
    btn.style.height= "20%";
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
})

