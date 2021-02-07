/************************************************************************************
 *                              Get Statistics Helpers
 ***********************************************************************************/

/**
 * Recieves all statistics as "data.stats" and sends it to the requested function for processing.
 */
socket.on('get-statistics', (data)=>{
    if(username !== data.username){
        return;
    }
    switch(data.request){
        case "record":
            getRecordStats(data.stats);
            break;
        case "time":
            getTimeStats(data.stats);
            break;
        case "superhero":
            getSuperheroStats(data.stats);
            break;
        case "sidekick":
            getSidekickStats(data.stats);
            break;
    }
})

/************************************************************************************
 *                              Sidekick Stats
 ***********************************************************************************/

 /**
  * Parses for sidekick statistics and sends the data to the chat.
  * 
  * @param {{}} stats All statistics being kept.
  */
function getSidekickStats(stats){
    header = [
        "Username", 
        "G", 
        `<i class="fas fa-search"></i>/<i class="fas fa-redo"></i>`,
        `<i class="fas fa-check"></i>/<i class="fas fa-redo"></i>`
    ];
    statistics = parseSidekickStats(stats);
    socket.emit('chat', {
        username: username,
        message: getMessage(statistics, header),
        roomname: roomname,
        event: "stats",
    })
}

/**
 * Helper function to parse sidekick statistics.
 * 
 * @param {{}} data All statistics
 * @returns {{string: [number, number, number, number, number]}} {username: [rounds, clues, success, games, avg]}
 */
function parseSidekickStats(data){
    statistics = {};
    data.forEach(gameStat => {
        for (const [key, value] of Object.entries(gameStat)) {
            if(value.role === "sidekick"){
                if(key in statistics){
                    statistics[key][0] += value.rounds;
                    statistics[key][1] += value.avgClueNumber*value.rounds;
                    statistics[key][2] += value.avgSuccessNumber*value.rounds;
                    statistics[key][3] += 1;
                } else {
                    statistics[key] = [value.rounds, value.avgClueNumber*value.rounds, value.avgSuccessNumber*value.rounds, 1];
                }
            }
        }
    })
    sidekickStats = {};
    for (const [key, value] of Object.entries(statistics)) {
        var avgClue=0;
        var avgSuccess=0;
        if (value[0] > 0){
            avgClue = value[1] / value[0];
            // Round to 2 decimal places if necessary.
            avgClue = Math.round((avgClue + Number.EPSILON) * 100) / 100;

            avgSuccess = value[2] / value[0];
            avgSuccess = Math.round((avgSuccess + Number.EPSILON) * 100) / 100;
        }

        sidekickStats[key] = [value[3], avgClue, avgSuccess];
    }
    return sidekickStats;
} 

/************************************************************************************
 *                              Superhero Stats
 ***********************************************************************************/

/**
 * Parses for superhero statistics and sends the results to the chat.
 * 
 * @param {{}} stats All statistics. 
 */
function getSuperheroStats(stats){
    header = [
        "Username", 
        "G", 
        `<i class="fas fa-check"></i>`, 
        `<i class="fas fa-times"></i>`, 
        `<i class="fas fa-percent"></i>`
    ];
    statistics = parseSuperheroStats(stats);
    socket.emit('chat', {
        username: username,
        message: getMessage(statistics, header),
        roomname: roomname,
        event: "stats",
    })
}

/**
 * Helper function to parse the data for relevant info.
 * 
 * @param {{}} data All statistics.
 * @returns {{string: [number, number, number, number]}} {username: [rounds, correct, wrong, percent]}
 */
function parseSuperheroStats(data){
    statistics = {};
    data.forEach(gameStat => {
        for (const [key, value] of Object.entries(gameStat)) {
            if(value.role === "superhero"){
                if(key in statistics){
                    statistics[key][0] +=1
                    statistics[key][1] += value.correct;
                    statistics[key][2] += value.wrong;
                } else {
                    statistics[key] = [1, value.correct, value.wrong];
                }
            }
        }
    })
    for (const [_, value] of Object.entries(statistics)) {
        var avg=0;
        if ((value[1]+value[0]) > 0){
            avg = value[1] / (value[0] + value[1]);
            // Round to 2 decimal places if necessary.
            avg = Math.round((avg + Number.EPSILON) * 100) / 100;
        }
        value.push(avg);
    }
    return statistics;
} 

/************************************************************************************
 *                              Time Stats
 ***********************************************************************************/

/**
 * Parses statistics for relevant time statistics.
 * 
 * @param {{}} stats All statistics.
 */
function getTimeStats(stats){
    statistics = parseTimeStats(stats);
    socket.emit('chat', {
        username: username,
        message: getMessage(statistics, ["Username", "Avg Time/Turn"]),
        roomname: roomname,
        event: "stats",
    })
}

/**
 * Parses the data for time statistics.
 * 
 * @param {{}} data All statistics.
 * @returns {{string: [number, number]}} {username: [time, turns]}
 */
function parseTimeStats(data){
    statistics = {};
    data.forEach(gameStat => {
        for (const [key, value] of Object.entries(gameStat)) {
            if(key in statistics){
                statistics[key][0] += (value.time*value.rounds);
                statistics[key][1] += value.rounds;
            } else {
                statistics[key] = [(value.time*value.rounds), value.rounds];
            }
        }
    })
    timeStats = {};
    for (const [key, value] of Object.entries(statistics)) {
        var avg=0;
        if (value[1] > 0){
            avg = value[0] / value[1];
            // Round to 2 decimal places if necessary.
            avg = Math.round((avg + Number.EPSILON) * 100) / 100;
        }
        timeStats[key] = [avg];
    }
    return timeStats;
}

/************************************************************************************
 *                              Win Loss Record Stats
 ***********************************************************************************/

/**
 * Parses data for W/L statistics.
 * 
 * @param {{}} stats All statistics.
 */
function getRecordStats(stats){
    statistics = parseRecordStats(stats);
    socket.emit('chat', {
        username: username,
        message: getMessage(statistics, ["Username", "W", "L"]),
        roomname: roomname,
        event: "stats",
    })
}

/**
 * Helper function to parse data.
 * 
 * @param {{}} data All statistics.
 * @returns {{string: [number, number]}} {username: [wins, losses]}
 */
function parseRecordStats(data){
    statistics = {};
    data.forEach(gameStat => {
        for (const [key, value] of Object.entries(gameStat)) {
            if(key in statistics){
                statistics[key][0] += value.win;
                statistics[key][1] += value.loss;
            } else {
                statistics[key] = [value.win, value.loss];
            }
        }
    })
    return statistics;
}

/************************************************************************************
 *                              Helper Functions for All Stats
 ***********************************************************************************/

function getMessage(statistics, statNames){
    var tableHead = `<table class="table table-sm table-striped">
                    <thead>
                    <tr>`;
    for(var i=0; i<statNames.length; i++){
        tableHead += `<th scope="col">${statNames[i]}</th>`;
    }
    tableHead += `</tr></thead>`;
    var tableBody = `<tbody>`;
    for (const [key, value] of Object.entries(statistics)) {
        tableBody += makeRow(key, value);
    }
    var tableFooter = `</tbody></table>`;

    return tableHead + tableBody + tableFooter;
}

function makeRow(username, values){
    var row = `<tr><td>${username}</td>`
    for (var i=0; i< values.length; i++){
        row += `<td>${values[i]}</td>`;
    }
    row += `</tr>`;
    return row;
}
