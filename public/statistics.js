/************************************************************************************
 *                              Get Statistics Helpers
 ***********************************************************************************/

socket.on('get-statistics', (data)=>{
    if(username !== data.username){
        return;
    }
    //data.stats
    switch(data.request){
        case "record":
            getRecordStats(data.stats);
            break;
        case "time":
            getTimeStats(data.stats);
            break;
        case "superhero":
            break;
        case "sidekick":
            break;
    }
})

/************************************************************************************
 *                              Sidekick Stats
 ***********************************************************************************/


/************************************************************************************
 *                              Superhero Stats
 ***********************************************************************************/


/************************************************************************************
 *                              Time Stats
 ***********************************************************************************/

function getTimeStats(stats){
    statistics = parseTimeStats(stats);
    socket.emit('chat', {
        username: username,
        message: getMessage(statistics, ["Username", "Avg Time/Turn"]),
        roomname: roomname,
        event: "stats",
    })
}

// Returns {username: [time:0, turns:0]}
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
    console.log(statistics);
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
    console.log(timeStats);
    return timeStats;
}

/************************************************************************************
 *                              Win Loss Record Stats
 ***********************************************************************************/

function getRecordStats(stats){
    statistics = parseRecordStats(stats);
    socket.emit('chat', {
        username: username,
        message: getMessage(statistics, ["Username", "W", "L"]),
        roomname: roomname,
        event: "stats",
    })
}

// Returns {username: [wins:0 losses:0]}
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

function makeItem(value){
    return `<td>${value}</td>`;
}