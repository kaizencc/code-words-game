// Dictionary that translates actual collection names to display page names.
var setTranslate = {};
setTranslate["codewords"]="Basic";
setTranslate["codewords-nsfw"] = "NSFW";
setTranslate["codewords-duet"] = "Duet";

/************************************************************************************
 *                              Change Wordset Events
 ***********************************************************************************/

const basicSet = document.getElementById('Basic');
const nsfwSet = document.getElementById('NSFW');
const duetSet = document.getElementById('Duet');

basicSet.addEventListener('click', () =>{
    changeSet("codewords");
})

nsfwSet.addEventListener('click', () =>{
    changeSet("codewords-nsfw");
})

duetSet.addEventListener('click', () =>{
    changeSet("codewords-duet");
})

function changeSet(newSet) {
    console.log("changing set");
    socket.emit('change-word-set', {
        roomname: roomname,
        username, username,
        set: newSet,
    });
}

socket.on('change-word-set', (data) => {
    sessionStorage.setItem('word-set', data.set);
    setWordSet();
})

/**
 * Moves the icon to the correct word set.
 */
function setWordSet(){
    if (sessionStorage.getItem('word-set')){
        switch (sessionStorage.getItem('word-set')){
            case "codewords":
                moveIcon(basicSet, "dd1");
                break;
            case "codewords-nsfw":
                moveIcon(nsfwSet, "dd1");
                break;
            case "codewords-duet":
                moveIcon(duetSet, "dd1");
                break;
        }
    }
}

/**
 * Moves the icon to the correct location.
 * 
 * @param {HTMLElement} to The button that was clicked.
 * @param {string} at The drop down the button belongs to.
 */
function moveIcon(to, at){
    var children = document.getElementById(at).children;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child === to){
            child.innerHTML = `${child.id} <i class="fas fa-gem"></i>`;
        } else {
            child.innerHTML = child.id;
        }
      }
}