const board = document.getElementById('board');

socket.on('board-game', (data) => {
    parsedData = JSON.parse(data)
    console.log(JSON.parse(data))
    parsedData.forEach(word => {
        board.appendChild(createButton(word));
    })
})

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

board.addEventListener('click', function(e){
    const name = e.target.id;
    console.log(name);
})

