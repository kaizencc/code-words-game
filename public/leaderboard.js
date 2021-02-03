document.addEventListener('DOMContentLoaded', () => {
    sortLeaders('winP'); 
})

function sortLeaders(on){
    let elements = [];
    let leaderboard = document.getElementById('leaderboard');
    // Add each row to the array
    leaderboard.querySelectorAll('.item').forEach(el => elements.push(el));
    // Clear the container
    leaderboard.innerHTML = '';
    // Sort the array from highest to lowest
    elements.sort((a, b) => b.querySelector(`.${on}`).textContent - a.querySelector(`.${on}`).textContent);
    // Put the elements back into the container
    elements.forEach(e => leaderboard.appendChild(e));  
}

function addEvents(){
    var c1 = document.getElementById('headers').children;
    var c2 = document.getElementById('bodyitems').children;
 
    for(var i=0; i < c1.length; i++){
        var className = c2[i].className;
        c1[i].addEventListener('click', makeSort.bind(this, className), false);
    }
}

function makeSort(className){
    sortLeaders(className);
}

addEvents();