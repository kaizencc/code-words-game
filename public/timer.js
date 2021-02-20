/************************************************************************************
 *                              Countdown Timer
 ***********************************************************************************/

const counter = document.getElementById('timer');
var timer;
// Audio for timer when below 10 seconds.
var tickAudio = new Audio('https://freesound.org/data/previews/254/254316_4062622-lq.mp3');

/**
 * Begins the timer count down and sends to socket if time is up.
 * 
 * @param {number} count The time that each player gets.
 * @param {string} forPlayer The current player whose turn it is.
 */
function startTimer(count, forPlayer){
    timer = setInterval(function() {
        counter.innerHTML = count;
        sessionStorage.setItem('time', count);
        if(count <= 10 && forPlayer === username){
            tickAudio.play();
        }
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

/**
 * Resets timer.
 */
function clearTimer(){
    clearInterval(timer);
}

/**
 * Stops timer completely.
 */
function endTimer(){
    clearInterval(timer);
    counter.innerHTML = "----";
    sessionStorage.removeItem('time');
    sessionStorage.removeItem('time-for');
}

/**
 * Starts the timer.
 * 
 * @param {string} forPlayer The player whose turn it is.
 * @param {number} time How much time the player gets.
 */
function clock(forPlayer, time){
    sessionStorage.setItem('time', String(time));
    sessionStorage.setItem('time-for', forPlayer);
    clearTimer();
    if (time > 0){
        startTimer(time, forPlayer);
    }
}

/************************************************************************************
 *                              Change Timer Event Listeners
 ***********************************************************************************/

const normalTime = document.getElementById('Normal');
const speedTime = document.getElementById('Speed');
const slowTime = document.getElementById('Slow');
const noTime = document.getElementById('None');

normalTime.addEventListener('click', () =>{
    changeTime(60);
})

speedTime.addEventListener('click', () =>{
    changeTime(30);
})

slowTime.addEventListener('click', () =>{
    changeTime(90);
})

noTime.addEventListener('click', () =>{
    changeTime(0);
})

socket.on('change-time', (data) => {
    sessionStorage.setItem('start-time', String(data.time));
    setTime();
})

/**
 * sets the new requested time and updates the selected icon.
 */
function setTime(){
    if (sessionStorage.getItem('start-time')){
        switch (sessionStorage.getItem('start-time')){
            case "30":
                moveIcon(speedTime, "dd2");
                break;
            case "90":
                moveIcon(slowTime, "dd2");
                break;
            case "0":
                moveIcon(noTime, "dd2");
                break;
            case "60":
                moveIcon(normalTime, "dd2");
        }
    }
}

/**
 * Called when a user changes the time setting.
 * 
 * @param {number} newTime The new time per turn
 */
function changeTime(newTime) {
    console.log("changing time");
    socket.emit('change-time', {
        roomname: roomname,
        username, username,
        time: newTime,
    });
}

/**
 * Hides both time and wordset button dropdowns.
 */
function hideSettings(){
    document.getElementById('set2').style.display = "none";
    document.getElementById('set1').style.display = "none";
    document.getElementById('set3').style.display = "none";
}

/**
 * Shows both time and wordset button dropdowns.
 */
function showSettings(){
    document.getElementById('set2').style.display = null;
    document.getElementById('set1').style.display = null;
    document.getElementById('set3').style.display = null;
}
