const basicSet = document.getElementById('Basic');
const nsfwSet = document.getElementById('NSFW');
const duetSet = document.getElementById('Duet');

basicSet.addEventListener('click', () =>{
    changeSet("codewords");
    moveIcon(basicSet);
})

nsfwSet.addEventListener('click', () =>{
    changeSet("codewords-nsfw");
    moveIcon(nsfwSet);
})

duetSet.addEventListener('click', () =>{
    changeSet("codewords-duet");
    moveIcon(duetSet);
})

function changeSet(newSet) {
    console.log("changing set");
    socket.emit('change-word-set', {
        roomname: roomname,
        set: newSet,
    });
}

function moveIcon(to){
    var children = document.getElementById("dd").children;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child === to){
            child.innerHTML = `${child.id} <i class="fas fa-gem"></i>`;
        } else {
            child.innerHTML = child.id;
        }
      }
}