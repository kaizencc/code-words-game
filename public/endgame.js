
/************************************************************************************
 *                              Game Over Modal
 ***********************************************************************************/

// Injects information of the game to the end game modal.
socket.on('game-over', async (data) => {
    console.log("game over");
    createModalTitle(data.winner);
    createModalFinalScores(data.redScore, data.blueScore, data.winner);
    const avgTimes = sortTimeByAvg(data.stats);
    createModalTimeStatistic(avgTimes);
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

function createModalTimeStatistic(times){
    const list = document.createElement("ul");
    for (var i=0; i<times.length; i++){
        // Create list item.
        var item = document.createElement('li');
        
        // Set contents.
        item.appendChild(document.createTextNode(`${times[i].username}: ${times[i].avg}`));

        // Add to list.
        list.appendChild(item);
    }
    document.getElementById('time-stats').appendChild(list);
}

// stats is a [{username: username, stats: stats}]
function sortTimeByAvg(playerStats){
    avgTimes = [];
    // Calculate total time from each stat.
    for (var i=0; i<playerStats.length; i++){
        totalTime = 0;
        for (var j=0; j<playerStats[i].stats.length; j++){
            totalTime += playerStats[i].stats[j].time;
        }

        avgTimes.push({
            username: playerStats[i].username,
            avg: totalTime/playerStats[i].stats.length,
        })
    }
    // avgTimes is [{username, avg}]
    console.log(avgTimes);
    avgTimes.sort(function (a,b) {
        return a.avg - b.avg;
    })
    return avgTimes;
}

function createModalFinalScores(redScore, blueScore, winner){
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