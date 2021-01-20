const counter = document.getElementById('timer');

var timer;

function startTimer(count, forPlayer){
    timer = setInterval(function() {
        counter.innerHTML = count;
        if(count == 0) {
            socket.emit('time-up', {
                roomname: roomname,
                username, forPlayer,
            });
        };
        count -=1;
    }, 1000);
}

function clearTimer(){
    clearInterval(timer);
}

function endTimer(){
    clearInterval(timer);
    counter.innerHTML = "----";
}

// Start the clock.
function clock(forPlayer){
    clearTimer();
    startTimer(60, forPlayer);
}
