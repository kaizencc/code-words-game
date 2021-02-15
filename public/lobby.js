const lobby = document.getElementById('playerlobby');

createPlayerAvatar("Bobby");
createPlayerAvatar("Bobby");
createPlayerAvatar("Bobby");
createPlayerAvatar("Bobby");
createPlayerAvatar("Bobby");
createPlayerAvatar("Bobby");
createPlayerAvatar("Bobby");


function createPlayerAvatar(username){
    const player = document.createElement('div');
    player.className = 'col';
    player.style = "max-width: 25%";


    const avatar = document.createElement('div');
    avatar.className = "avatar text-center";
    const text = document.createElement('h2');
    text.innerHTML = username;

    avatar.appendChild(text);
    player.appendChild(avatar);
    lobby.appendChild(player);
}