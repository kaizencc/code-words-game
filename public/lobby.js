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

leaveBtn.addEventListener('click', () => {
    socket.emit('leave-lobby', {})
    showEnterForm();
})

socket.on('display-lobby', (data) => {
    lobby.innerHTML = "";
    data.players.forEach((player) => {
        createPlayerAvatar(player.username);
    })
})

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