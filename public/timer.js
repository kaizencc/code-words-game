/************************************************************************************
 *                              Countdown Timer
 ***********************************************************************************/

const counter = document.getElementById('timer');
var timer;

// Begins countdown, responding to socket if time is up.
function startTimer(count, forPlayer){
    timer = setInterval(function() {
        counter.innerHTML = count;
        sessionStorage.setItem('time', count);
        if(count == 0) {
            if (forPlayer === username){
                socket.emit('time-up', {
                    roomname: roomname,
                    username, forPlayer,
                });
            } else {
                clearInterval(timer);
            }
        };
        count -=1;
    }, 1000);
}

// Resets timer.
function clearTimer(){
    clearInterval(timer);
}

// Stops timer altogether.
function endTimer(){
    clearInterval(timer);
    counter.innerHTML = "----";
    sessionStorage.removeItem('time');
    sessionStorage.removeItem('time-for');
}

// Start the clock.
function clock(forPlayer){
    sessionStorage.setItem('time', '60');
    sessionStorage.setItem('time-for', forPlayer);
    clearTimer();
    startTimer(60, forPlayer);
}
