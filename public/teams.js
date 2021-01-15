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

$(document).ready(function() {
    var redTeam = document.getElementById('users-red');
    var blueTeam = document.getElementById('users-blue');
    new Sortable(redTeam, {
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

            // Broadcast to chat
            sendTeamMessage("red")

            // Update database
            updateTeamInDatabase("red")
        }
    });
    new Sortable(blueTeam, {
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

            // Broadcast to chat
            sendTeamMessage("blue")

            // Update database
            updateTeamInDatabase("blue")

        }
    });
});