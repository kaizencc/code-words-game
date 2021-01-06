const board = document.getElementById('board');

socket.on('board-game', (data) => {
    data.forEach(word => {
        board.appendChild(createButton(word));
    })
})

function createButton(word){
    var btn = document.createElement("button");
    btn.style.width = "18%";
    btn.style.height= "20%";
    btn.id = word;
    btn.className = "btn btn-secondary m-1 p-auto";
    var t = document.createTextNode(word);
    btn.appendChild(t);
    return btn;
}

board.addEventListener('click', function(e){
    const name = e.target.id;
    console.log(name);
})

