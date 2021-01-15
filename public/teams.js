$(document).ready(function() {
    var example2Left = document.getElementById('users-red');
    var example2Right = document.getElementById('users-blue');
    new Sortable(example2Left, {
        group: {
            name: 'shared',
            pull: true,
            put: true,
        },
        cursor: 'move',
        animation: 150
    });
    new Sortable(example2Right, {
        group: {
            name: 'shared',
            pull: true,
            put: true,
        },
        cursor: 'move',
        animation: 150
    });
});