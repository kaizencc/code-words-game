/**
 * Sort initial leaderboard by win percentage.
 */
document.addEventListener('DOMContentLoaded', () => {
    sortLeaders('wins'); 
})

/**
 * Sort players on the leaderboard by a specific statistic.
 * 
 * @param {string} sortBy The statistic to sort by.
 */
function sortLeaders(sortBy){
    let elements = [];
    let leaderboard = document.getElementById('leaderboard');
    // Add each row to the array
    leaderboard.querySelectorAll('.item').forEach(el => elements.push(el));
    // Clear the container
    leaderboard.innerHTML = '';
    // Sort the array from highest to lowest
    elements.sort((a, b) => b.querySelector(`.${sortBy}`).textContent - a.querySelector(`.${sortBy}`).textContent);
    // Put the elements back into the container
    elements.forEach(e => leaderboard.appendChild(e));  
}

/**
 * Add event listeners to each of the sortable statistics.
 */
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