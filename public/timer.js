const counter = document.getElementById('timer');

function startTimer(count){
    timer = setInterval(function() {
        counter.innerHTML = (count);
        if(count == 0) {
            clearInterval(timer);
        };
        count -=1;
    }, 1000);
}

startTimer(100);
