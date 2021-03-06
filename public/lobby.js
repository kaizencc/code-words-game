const socket = io.connect();

socket.emit('lobby', {})

const lobbyBtn = document.getElementById('lobbybtn');
const leaveBtn = document.getElementById('leavebtn');
const usernameSpace = document.getElementById('username');
const lobby = document.getElementById('playerlobby');

/**
 * When enter is clicked, validate the username and create an avatar in the player lobby.
 */
lobbyBtn.addEventListener('click', () => {
    socket.emit('join-lobby', {username: usernameSpace.value});
    usernameSpace.value = "";
    showLeaveForm();
})

/**
 * When leave is clicked, remove the player from the lobby queue.
 */
leaveBtn.addEventListener('click', () => {
    socket.emit('leave-lobby', {});
    showEnterForm();
})

/**
 * Display all the players currently in the lobby queue.
 */
socket.on('display-lobby', (data) => {
    lobby.innerHTML = "";
    data.players.forEach((player) => {
        createPlayerAvatar(player.username);
        if(data.username == player.username){
            runAnimation();
        }
    })
})

/**
 * Sends each of the 4 players in the room and handles a race condition by pausing 3 players to allow the room to get created.
 */
socket.on('enter-room', (data) => {
    data.players.forEach(async (player) => {
        if (socket.id === player.socket){
            // allow first player to create the room.
            if (player.first !== true){
                await sleep(1000);
            }
            enterRoomButton(player.username, data.roomname);
        }
    })
})

/**
 * Handles things when a bad username is detected.
 */
socket.on('bad-username', (data) => {
    showEnterForm();
    if (data.reason === "profanity"){
        alert("Please do not use profanity in your username");
    } else if (data.reason === "duplicate"){
        alert("Your username is in use by someone else, please pick a different name");
    }
})

/**
 * Creates the html required for the player avatar to show up on screen.
 * 
 * @param {string} username The players username
 */
function createPlayerAvatar(username){
    const player = document.createElement('div');
    player.className = 'col';
    player.style = "max-width: 25%";

    const avatar = document.createElement('div');
    avatar.className = "avatar border border-success rounded text-center";
    avatar.style.setProperty("border-width", "thick", "important");
    const text = document.createElement('h2');
    text.innerHTML = username;

    avatar.appendChild(text);
    player.appendChild(avatar);
    lobby.appendChild(player);
}

function showEnterForm(){
    document.getElementById('leave-form').style = "display:none";
    document.getElementById('enter-form').style = null;
}

function showLeaveForm(){
    document.getElementById('enter-form').style = "display:none";
    document.getElementById('leave-form').style = null;
}

/**
 * This function adds the correct values to the hidden submit form which is then clicked,
 * redirecting to the room landing page.
 * 
 * @param {string} username Players username
 * @param {string} roomname Room to enter into
 */
function enterRoomButton(username, roomname){
    document.getElementById('name').value = username;
    document.getElementById('room').value = roomname;
    document.getElementById('enter').click();
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