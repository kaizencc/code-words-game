document.addEventListener('DOMContentLoaded', () => {
    let elements = [];
    let leaderboard = document.getElementById('leaderboard');
    // Add each row to the array
    leaderboard.querySelectorAll('.item').forEach(el => elements.push(el));
    // Clear the container
    leaderboard.innerHTML = '';
    // Sort the array from highest to lowest
    elements.sort((a, b) => b.querySelector('.winP').textContent - a.querySelector('.winP').textContent);
    // Put the elements back into the container
    console.log(elements);
    elements.forEach(e => leaderboard.appendChild(e));
  })