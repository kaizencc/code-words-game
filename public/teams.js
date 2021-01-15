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
        onEnd: function(event){
            var item = event.item;
            item.classList.remove("border-danger");
            item.classList.remove("text-danger");
            item.classList.add("border-primary");
            item.classList.add("text-primary");
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
        onEnd: function(event){
            var item = event.item;
            item.classList.remove("border-primary");
            item.classList.remove("text-primary");
            item.classList.add("border-danger");
            item.classList.add("text-danger");
        }
    });
});