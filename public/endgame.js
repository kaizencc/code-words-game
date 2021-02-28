/************************************************************************************
 *                              Game Over Modal
 ***********************************************************************************/

/**
 * Receives information about who won and statistics for the game.
 * Processes the information and sends it to the endgame modal that pops up.
 * Processes the information and sends it to the leaderboard.
 */
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

    var leaderboardStats = {};

    // Clear tables.
    document.getElementById('superhero-table').innerHTML="";
    document.getElementById('sidekick-table').innerHTML="";

    // Create superhero table
    const redSuperheroStats = getPlayerStatistics(data.stats, data.redSuperhero);
    const finalRedSuperheroStats = calculateSuperheroStats(redSuperheroStats);
    var rowInfo = addSuperheroRow(data.redSuperhero, finalRedSuperheroStats, "red");

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 1;
            rowInfo.loss = 0;
            finalRedSuperheroStats.wins= 1;
            finalRedSuperheroStats.losses=0;
        } else {
            rowInfo.win = 0;
            rowInfo.loss = 1;
            finalRedSuperheroStats.wins= 0;
            finalRedSuperheroStats.losses=1;
        }
        gameStats[data.redSuperhero] = rowInfo;
        finalRedSuperheroStats.role = "superhero",
        leaderboardStats[data.redSuperhero] = finalRedSuperheroStats;
    }

    const blueSuperheroStats = getPlayerStatistics(data.stats, data.blueSuperhero);
    const finalBlueSuperheroStats = calculateSuperheroStats(blueSuperheroStats);
    rowInfo = addSuperheroRow(data.blueSuperhero, finalBlueSuperheroStats, "blue");

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 0;
            rowInfo.loss = 1;
            finalBlueSuperheroStats.wins= 0;
            finalBlueSuperheroStats.losses=1;
        } else {
            rowInfo.win = 1;
            rowInfo.loss = 0;
            finalBlueSuperheroStats.wins= 1;
            finalBlueSuperheroStats.losses=0;
        }
        gameStats[data.blueSuperhero] = rowInfo;
        finalBlueSuperheroStats.role = "superhero",
        leaderboardStats[data.blueSuperhero] = finalBlueSuperheroStats;
    }

    // Create sidekick table
    const redSidekickStats = getPlayerStatistics(data.stats, data.redSidekick);
    rawStats = calculateRawSidekickStats(redSidekickStats, redSuperheroStats);
    const finalRedSidekickStats = calculateSidekickStats(rawStats);
    rowInfo = addSidekickRow(data.redSidekick, finalRedSidekickStats, "red");

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 1;
            rowInfo.loss = 0;
            rawStats.wins= 1;
            rawStats.losses=0;
        } else {
            rowInfo.win = 0;
            rowInfo.loss = 1;
            rawStats.wins= 0;
            rawStats.losses=1;
        }
        gameStats[data.redSidekick] = rowInfo;
        rawStats.role = "sidekick",
        leaderboardStats[data.redSidekick] = rawStats;
    }
    const blueSidekickStats = getPlayerStatistics(data.stats, data.blueSidekick);
    rawStats = calculateRawSidekickStats(blueSidekickStats, blueSuperheroStats);
    const finalBlueSidekickStats = calculateSidekickStats(rawStats);
    rowInfo = addSidekickRow(data.blueSidekick, finalBlueSidekickStats, "blue");

    if (username === data.redSuperhero){
        if(data.winner === "red"){
            rowInfo.win = 0;
            rowInfo.loss = 1;
            rawStats.wins= 0;
            rawStats.losses=1;
        } else {
            rowInfo.win = 1;
            rowInfo.loss = 0;
            rawStats.wins= 1;
            rawStats.losses=0;
        }
        gameStats[data.blueSidekick] = rowInfo;
        rawStats.role = "sidekick",
        leaderboardStats[data.blueSidekick] = rawStats;
    }

    // Send processed data to endgame modal and to leaderboard.
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

        socket.emit('update-leaderboard', {
            roomname: roomname,
            leaderboardStats: leaderboardStats,
        });
    }

    // Wait a second and Show modal.
    await sleep(1000);
    $("#myModal").modal("show").on('shown.bs.modal', function () {
        $(".modal").css('display', 'block');
    });
})

/**
 * Helper function to isolate a single players statistics from the stats object.
 * 
 * @param {{}} stats An object that holds statistics for all players in the room.
 * @param {string} username The username of the user we are trying to pull information from.
 * @returns {{}} The statistics for just the player we asked for.
 */
function getPlayerStatistics(stats, username){
    const result = stats.filter(statistic => statistic.username === username);
    return result[0].stats;
}

/**
 * Helper function to calculate sidekick statistics, broken up into 2. This is part 1.
 * 
 * @param {{}} sidekickStats statistics for the sidekick
 * @param {{}} superheroStats statistics for the accompanying superhero on the same team.
 * @returns raw statistics to be used in both leaderboard and end game modal.
 */
function calculateRawSidekickStats(sidekickStats, superheroStats){
    var totalWords = 0;
    var totalRounds= 0;
    var cryptonight = 0;
    sidekickStats.forEach(s => {
        totalRounds +=1;
        totalWords += Number(s.number);
    })

    var totalCorrect =0;
    superheroStats.forEach(s => {
        totalCorrect += s.correct;
        cryptonight += s.cryptonight;
    })

    return {
        totalWords: totalWords,
        totalRounds: totalRounds,
        totalCorrect: totalCorrect,
        cryptonight: cryptonight,
    }
}

/**
 * Processes data to be consumed by end game modal. This is the second part that processes data from part 1.
 * 
 * @param {{}} rawStats raw statistics from part 1.
 * @returns data to be used by the end game modal.
 */
function calculateSidekickStats(rawStats){
    var avgClueNumber = 0;
    var avgSuccessNumber = 0;
    if (rawStats.totalRounds > 0){
        avgClueNumber = rawStats.totalWords / rawStats.totalRounds;
        avgClueNumber = Math.round((avgClueNumber + Number.EPSILON) * 100) / 100;
        avgSuccessNumber = rawStats.totalCorrect / rawStats.totalRounds;
        avgSuccessNumber = Math.round((avgSuccessNumber + Number.EPSILON) * 100) / 100;
    }

    return {
        avgClueNumber: avgClueNumber,
        avgSuccessNumber: avgSuccessNumber,
        totalRounds: rawStats.totalRounds,
    }
}

/**
 * Calculates superhero statistics. Used for both end game modal and leaderboard.
 * 
 * @param {{}} stats statistics relevant to superhero players.
 * @returns statistics to be consumed by end game modal and leaderboard.
 */
function calculateSuperheroStats(stats){
    var correct = 0;
    var opposite = 0;
    var yellow = 0;
    var crypto = 0;
    var totalRounds = 0;
    stats.forEach(s =>{
        totalRounds += 1;
        correct += s.correct;
        opposite += s.opposite;
        yellow += s.yellow;
        crypto += s.cryptonight;
    })
    return {
        correct: correct, 
        opposite: opposite, 
        yellow: yellow,
        cryptonight: crypto,
        totalRounds: totalRounds,
    }
}

/**
 * Creates the html elements necessary to add a row to the superhero table in the end game modal.
 * 
 * @param {string} username The players username
 * @param {{}} stats The processed statistics relevant to the player
 * @param {"red" | "blue"} color The team that the player is on.
 * @returns data to be consumed by leaderboard, since the data overlaps.
 */
function addSuperheroRow(username, stats, color){
    var row = document.createElement('tr');
    row.appendChild(addCol(username));
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
        rounds: stats.totalRounds,
    }
}

/**
 * Creates the html elements necessary to add a row to the sidekick table in the end game modal.
 * 
 * @param {string} username The players username
 * @param {{}} stats The processed statistics relevant to the player
 * @param {"red" | "blue"} color The team that the player is on.
 * @returns data to be consumed by leaderboard, since the data overlaps.
 */
function addSidekickRow(username, stats, color){
    var row = document.createElement('tr');
    row.appendChild(addCol(username));
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
        rounds: stats.totalRounds,
    }
}

/**
 * Helper function to add a column to the table.
 * @param {string} text 
 * @returns {HTMLElement} the column
 */
function addCol(text){
    const col = document.createElement('th');
    col.scope = "col";
    col.innerHTML = text;
    return col;
}

/**
 * Creates the time statistic in the end gmae modal for all players.
 * 
 * @param {{}} times data structure that holds the time data for all playesr.
 */
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

/**
 * Calculates the average time spent of each player and then sorts the array in ascending order.
 * 
 * @param {[{username, stats}]} playerStats list of team time stats unsorted, without average.
 * @returns {[{username, avg, team}]} list of team time stats sorted by average time.
 */
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

/**
 * Creates the title of the end game modal.
 * 
 * @param {"red" | "blue"} winner The winning team 
 */
function createModalTitle(winner){
    const modalTitle = document.getElementById('modal-title');
    modalTitle.innerHTML = "";
    modalTitle.appendChild(createIcon(winner, "fas fa-trophy"));
    modalTitle.appendChild(document.createTextNode(` ${capitalizeFirstLetter(winner)} Wins! `));
    modalTitle.appendChild(createIcon(winner, "fas fa-trophy"));
}

/**
 * Create final scores for each team in end game modal.
 * 
 * @param {number} redScore 
 * @param {number} blueScore 
 * @param {"red" | "blue"} winner 
 */
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

/**
 * Helper function that capitalizes the first letter of the string.
 * 
 * @param {string} string 
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Helper function that creates a red or blue icon
 * 
 * @param {"red" | "blue" | "green"} color
 * @param {string} iconName the name of the icon from font awesome 
 */
function createIcon(color, iconName){
    const icon = document.createElement("span");
    if (color === "red"){
        icon.className = "text-danger";
    } else if (color === "blue") {
        icon.className = "text-primary";
    } else {
        icon.className = "text-success";
    }
    icon.innerHTML = `<i class="${iconName}"></i>`;
    return icon;
}

/**
 * Helper function that waits for the number of milliseconds given.
 * Used to wait for other processes to finish.
 * 
 * @param {number} ms milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
}
