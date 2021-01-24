
/************************************************************************************
 *                              Game Over Modal
 ***********************************************************************************/

// Injects information of the game to the end game modal.
socket.on('game-over', async (data) => {
    // Allow user to toggle between roles after clicking out of modal.
    endTimer();
    unlockRoles();

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
    modalTitle.appendChild(document.createTextNode(` ${capitalizeFirstLetter(winner)} Wins! `));
    modalTitle.appendChild(createIcon(winner));
}

function createModalTimeStatistic(times){
    const list = document.getElementById('time-stats');
    list.innerHTML = "";
    for (var i=0; i<times.length; i++){
        // Create card
        let card = document.createElement('h5'); 
        card.className = "w-100 border rounded text-center mx-auto";
        card.innerHTML = `${times[i].username}: ${times[i].avg} seconds`;
        if (times[i].team === "red"){
            card.classList.add("border-danger");
            card.classList.add("text-danger");
        } else {
            card.classList.add("border-primary");
            card.classList.add("text-primary");
        }
        list.appendChild(card);
    }
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

        var avg=0;
        if (playerStats[i].stats.length > 0){
            avg = totalTime/playerStats[i].stats.length;
            // Round to 2 decimal places if necessary.
            avg = Math.round((avg + Number.EPSILON) * 100) / 100;
        }

        avgTimes.push({
            username: playerStats[i].username,
            avg: avg,
            team: playerStats[i].team,
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
    document.getElementById('red-final').innerHTML = redScore;
    document.getElementById('blue-final').innerHTML = blueScore;
    if (winner === "red"){
        document.getElementById('red-modal').style.setProperty("border-width", "thick", "important");
        document.getElementById('blue-modal').style.setProperty("border-width", "thin", "important");
        document.getElementById('red-title').innerHTML = icon("fas fa-medal", "danger") + document.getElementById('red-title').innerHTML;
        document.getElementById('blue-title').innerHTML += icon("fas fa-bomb","primary");
    } else {
        document.getElementById('red-modal').style.setProperty("border-width", "thin", "important");
        document.getElementById('blue-modal').style.setProperty("border-width", "thick", "important");
        document.getElementById('red-title').innerHTML = icon("fas fa-bomb", "danger") + document.getElementById('red-title').innerHTML;
        document.getElementById('blue-title').innerHTML += icon("fas fa-medal","primary");
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