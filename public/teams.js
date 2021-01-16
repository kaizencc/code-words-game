//var redTeam = document.getElementById('users-red');
//var blueTeam = document.getElementById('users-blue');

function sendTeamMessage(team){
    socket.emit('chat', {
        username: username,
        message: `${team} team`,
        roomname: roomname,
        event: "switch-team",
    });
}

function updateTeamInDatabase(team){
    socket.emit('change-teams', {
        roomname: roomname, 
        username: username, 
        team: team,
    });
}

// Displaying if a user is typing.
socket.on('move-user', (data) => {
    console.log('haaaa');
    console.log(data.username, username, data.team);
    if (data.username === username){
        console.log('already done, username')
    } else {
        item = document.getElementById(data.elementId);
        if (data.team === "red"){
            item.classList.remove("border-primary");
            item.classList.remove("text-primary");
            item.classList.add("border-danger");
            item.classList.add("text-danger");
            blueUsers.removeChild(item);
            redUsers.appendChild(item);

        } else {
            item.classList.remove("border-danger");
            item.classList.remove("text-danger");
            item.classList.add("border-primary");
            item.classList.add("text-primary");
            redUsers.removeChild(item);
            blueUsers.appendChild(item);
        }
    }

})

$(document).ready(function() {
    new Sortable(redUsers, {
        group: {
            name: 'shared',
            pull: true,
            put: true,
        },
        cursor: 'move',
        animation: 150,
        onAdd: function(event){
            var item = event.item;
            // Change button color
            item.classList.remove("border-primary");
            item.classList.remove("text-primary");
            item.classList.add("border-danger");
            item.classList.add("text-danger");
            console.log(item.id);
            socket.emit('move-user',{
                username: username,
                roomname: roomname,
                elementId: item.id,
                team: "red"
            })

            // Broadcast to chat
            sendTeamMessage("red");

            // Update database
            updateTeamInDatabase("red");
        }
    });
    new Sortable(blueUsers, {
        group: {
            name: 'shared',
            pull: true,
            put: true,
        },
        cursor: 'move',
        animation: 150,
        onAdd: function(event){
            var item = event.item;
            // Change button color
            item.classList.remove("border-danger");
            item.classList.remove("text-danger");
            item.classList.add("border-primary");
            item.classList.add("text-primary");
            console.log(item.id);
            socket.emit('move-user',{
                username: username,
                roomname: roomname,
                elementId: item.id,
                team: "blue"
            })

            // Broadcast to chat
            sendTeamMessage("blue");

            // Update database
            updateTeamInDatabase("blue");

        }
    });
});