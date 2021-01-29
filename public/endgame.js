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

    // Create average time statistics
    const avgTimes = sortTimeByAvg(data.stats);
    createModalTimeStatistic(avgTimes);

    // Create gameStats dictionary to be sent to mongoDb
    // Only need one player to keep track of game stats
    var gameStats = {};

    // Clear tables.
    document.getElementById('superhero-table').innerHTML="";
    document.getElementById('sidekick-table').innerHTML="";

    // Create superhero table
    const redSuperheroStats = getPlayerStatistics(data.stats, data.redSuperhero);
    const finalRedSuperheroStats = calculateClickStats(redSuperheroStats);
    var rowInfo = addSuperheroRow(data.redSuperhero, finalRedSuperheroStats, "red");

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 1;
            rowInfo.loss = 0;
        } else {
            rowInfo.win = 0;
            rowInfo.loss = 1;
        }
        gameStats[data.redSuperhero] = rowInfo;
    }

    const blueSuperheroStats = getPlayerStatistics(data.stats, data.blueSuperhero);
    const finalBlueSuperheroStats = calculateClickStats(blueSuperheroStats);
    rowInfo = addSuperheroRow(data.blueSuperhero, finalBlueSuperheroStats, "blue");

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 0;
            rowInfo.loss = 1;
        } else {
            rowInfo.win = 1;
            rowInfo.loss = 0;
        }
        gameStats[data.blueSuperhero] = rowInfo;
    }

    // Create sidekick table
    const redSidekickStats = getPlayerStatistics(data.stats, data.redSidekick);
    const finalRedSidekickStats = calculateSidekickStats(redSidekickStats, redSuperheroStats);
    rowInfo = addSidekickRow(data.redSidekick, finalRedSidekickStats, "red", data.winner);

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 1;
            rowInfo.loss = 0;
        } else {
            rowInfo.win = 0;
            rowInfo.loss = 1;
        }
        gameStats[data.redSidekick] = rowInfo;
    }
    const blueSidekickStats = getPlayerStatistics(data.stats, data.blueSidekick);
    const finalBlueSidekickStats = calculateSidekickStats(blueSidekickStats, blueSuperheroStats);
    rowInfo = addSidekickRow(data.blueSidekick, finalBlueSidekickStats, "blue", data.winner);

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 0;
            rowInfo.loss = 1;
        } else {
            rowInfo.win = 1;
            rowInfo.loss = 0;
        }
        gameStats[data.blueSidekick] = rowInfo;
    }

    if (username === data.redSuperhero){
        // Add time into gameStats
        avgTimes.forEach(o =>{
            gameStats[o.username].time = o.avg;
        })        

        console.log(gameStats);
        socket.emit('add-endgame-statistic', {
            roomname: roomname,
            gameStats: gameStats,
        });
    }

    // Wait a second and Show modal.
    await sleep(1000);
    $("#myModal").modal("show").on('shown.bs.modal', function () {
        $(".modal").css('display', 'block');
    });
})

function getPlayerStatistics(stats, username){
    const result = stats.filter(statistic => statistic.username === username);
    return result[0].stats;
}

function calculateSidekickStats(sidekickStats, superheroStats){
    var totalWords = 0;
    var totalRounds= 0;
    sidekickStats.forEach(s => {
        totalRounds +=1;
        totalWords += Number(s.number);
    })

    var totalCorrect =0;
    superheroStats.forEach(s => {
        totalCorrect += s.correct;
    })

    var avgClueNumber = 0;
    var avgSuccessNumber = 0;
    if (totalRounds > 0){
        avgClueNumber = totalWords / totalRounds;
        avgClueNumber = Math.round((avgClueNumber + Number.EPSILON) * 100) / 100;
        avgSuccessNumber = totalCorrect / totalRounds;
        avgSuccessNumber = Math.round((avgSuccessNumber + Number.EPSILON) * 100) / 100;
    }

    return {
        avgClueNumber: avgClueNumber,
        avgSuccessNumber: avgSuccessNumber,
    }
}

function calculateClickStats(stats){
    var correct = 0;
    var opposite = 0;
    var yellow = 0;
    var crypto = 0;
    stats.forEach(s =>{
        correct += s.correct;
        opposite += s.opposite;
        yellow += s.yellow;
        crypto += s.cryptonight;
    })
    console.log(correct, opposite, yellow, crypto);
    return {
        correct: correct, 
        opposite: opposite, 
        yellow: yellow,
        cryptonight: crypto,
    }
}

// Add row to superhero table.
function addSuperheroRow(player, stats, color){
    console.log(stats, stats.correct, stats.opposite, stats.yellow);
    var row = document.createElement('tr');
    row.appendChild(addCol(player));
    row.appendChild(addCol(stats.correct));
    const totalWrong = stats.opposite + stats.yellow + stats.cryptonight;
    row.appendChild(addCol(totalWrong));
    var percentage = 0;
    if (totalWrong + stats.correct === 0){
        row.appendChild(addCol(percentage));
    } else {
        percentage = stats.correct/(totalWrong + stats.correct);
        percentage = Math.round((percentage + Number.EPSILON) * 100) / 100;
        row.appendChild(addCol(percentage));
    }
    if (color === "red"){
        row.className = "text-danger";
    } else {
        row.className = "text-primary";
    }

    document.getElementById('superhero-table').appendChild(row);

    return {
        correct: stats.correct,
        wrong: totalWrong,
        percentage: percentage,
        role: "superhero",
    }
}

// Add row to sidekick table.
function addSidekickRow(player, stats, color){
    console.log(stats, stats.number);
    var row = document.createElement('tr');
    row.appendChild(addCol(player));
    row.appendChild(addCol(stats.avgClueNumber));
    row.appendChild(addCol(stats.avgSuccessNumber));

    if (color === "red"){
        row.className = "text-danger";
    } else {
        row.className = "text-primary";
    }
    document.getElementById('sidekick-table').appendChild(row);

    return {
        avgClueNumber: stats.avgClueNumber,
        avgSuccessNumber: stats.avgSuccessNumber,
        role: "sidekick",
    }
}

// Helper function to add a column to a table.
function addCol(text){
    const col = document.createElement('th');
    col.scope = "col";
    col.innerHTML = text;
    return col;
}

// Creates title of either red or blue win.
function createModalTitle(winner){
    const modalTitle = document.getElementById('modal-title');
    modalTitle.innerHTML = "";
    modalTitle.appendChild(createIcon(winner));
    modalTitle.appendChild(document.createTextNode(` ${capitalizeFirstLetter(winner)} Wins! `));
    modalTitle.appendChild(createIcon(winner));
}

// Creates time statistics of all 4 players
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
    // avgTimes is [{username, avg, team}]
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

/************************************************************************************
 *                              Get Statistics Helpers
 ***********************************************************************************/

socket.on('get-statistics', (data)=>{
    statistics = parseGameStats(data);
    socket.emit('chat', {
        username: username,
        message: getMessage(statistics),
        roomname: roomname,
        event: "stats",
    })
})

// Returns {username: {wins:0 losses:0}}
function parseGameStats(data){
    statistics = {}
    for (const [key, value] of Object.entries(data)) {
        if(key in statistics){
            statistics[key] = 0;
        } else {
            statistics[key] = 0;
        }
    }
}

function getMessage(statistics){
    var tableHead = `<table class="table table-sm table-striped">
                    <thead>
                    <tr>
                        <th scope="col">Username</th>
                        <th scope="col">W</th>
                        <th scope="col">L</th>
                    </tr>
                    </thead>`;
    var tableBody = `<tbody>`;
    for (const [key, value] of Object.entries(statistics)) {
        tableBody += makeRow(key, value.wins, value.losses);
    }
    var tableFooter = `</tbody></table>`;

    return tableHead + tableBody + tableFooter;
}

function makeRow(username, wins, losses){
    return `<tr>
                <td>${username}</td>
                <td>${wins}</td>
                <td>${losses}</td>
            </tr>`
}