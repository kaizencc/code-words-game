
/************************************************************************************
 *                              Game Over Modal
 ***********************************************************************************/

// Injects information of the game to the end game modal.
socket.on('game-over', async (data) => {
    console.log("game over");
    createModalTitle(data.winner);
    createModalBody(data.redScore, data.blueScore, data.winner);
    // Wait a second and Show modal.
    await sleep(1000);
    $("#myModal").modal("show").on('shown.bs.modal', function () {
        $(".modal").css('display', 'block');
    });
})

function createModalTitle(winner){
    const modalTitle = document.getElementById('modal-title');
    modalTitle.innerHTML = "";
    modalTitle.appendChild(createIcon(winner));
    modalTitle.appendChild(document.createTextNode(` ${capitalizeFirstLetter(winner)} Team Wins! `));
    modalTitle.appendChild(createIcon(winner));
}

function createModalBody(redScore, blueScore, winner){
    //const modalBody = document.getElementById('modal-body');
    document.getElementById('red-final').innerHTML = redScore;
    document.getElementById('blue-final').innerHTML = blueScore;
    if (winner === "red"){
        document.getElementById('red-modal').style.setProperty("border-width", "thick", "important");
        document.getElementById('blue-modal').style.setProperty("border-width", "thin", "important");

    } else {
        document.getElementById('red-modal').style.setProperty("border-width", "thin", "important");
        document.getElementById('blue-modal').style.setProperty("border-width", "thick", "important");
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function createIcon(color){
    const icon = document.createElement("span");
    if (color === "red"){
        icon.className = "text-danger";
    } else {
        icon.className = "text-primary";
    }
    icon.innerHTML = '<i class="fas fa-trophy"></i>';
    return icon;
}

// Helper function to wait for other processes to finish.
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}

// Listening for new game request.
newGameBtn.addEventListener('click', () =>{
    socket.emit('new-game',{
        username: username, 
        roomname: roomname,
    });
})