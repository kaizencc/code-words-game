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
        animation: 150
    });
    new Sortable(blueTeam, {
        group: {
            name: 'shared',
            pull: true,
            put: true,
        },
        cursor: 'move',
        animation: 150
    });
});