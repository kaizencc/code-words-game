// Dictionary that translates actual collection names to display page names.
var setTranslate = {};
setTranslate["codewords"]="Basic";
setTranslate["codewords-nsfw"] = "NSFW";
setTranslate["codewords-duet"] = "Duet";
setTranslate["custom"] = "Custom";

/************************************************************************************
 *                              Change Wordset Events
 ***********************************************************************************/

const basicSet = document.getElementById('Basic');
const nsfwSet = document.getElementById('NSFW');
const duetSet = document.getElementById('Duet');
const customSet = document.getElementById('Custom');

basicSet.addEventListener('click', () => {
    changeSet("codewords");
})

nsfwSet.addEventListener('click', () => {
    changeSet("codewords-nsfw");
})

duetSet.addEventListener('click', () => {
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
            case "custom":
                moveIcon(customSet, "dd1");
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
            // Special case for custom
            if (to.id === "Custom"){
                child.innerHTML = `${child.id} <i class="fas fa-gem"></i> <input type="file" id="file-selector" name="custom" accept=".csv" onchange='triggerValidation(this)'/>`;
                addFileEventListener();
            } else {
                child.innerHTML = `${child.id} <i class="fas fa-gem"></i>`;
            }
        } else {
            if (child.id === "Custom"){
                child.innerHTML = `${child.id} <input type="file" id="file-selector" name="custom" accept=".csv" onchange='triggerValidation(this)'/>`;
                addFileEventListener();
            } else {
                child.innerHTML = child.id;
            }
        }
    }
}

var regex = new RegExp("(.*?)\.(csv)$");

function triggerValidation(el) {
  if (!(regex.test(el.value.toLowerCase()))) {
    el.value = '';
    alert('Please select correct file format');
  }
}

addFileEventListener();

function addFileEventListener(){
    document.getElementById('file-selector').addEventListener('change', (event) => {
        const file = event.target.files[0];
        console.log(file);
        if (!file.type) {
            status.textContent = 'Error: The File.type property does not appear to be supported on this browser.';
            return;
        }
    
        // Name file something unique to ensure no overlap.
        var filename = file.name.substring(0, file.name.lastIndexOf('.')) + Date.now();
        console.log(filename);
    
        const reader = new FileReader();
        reader.readAsText(file);
    
        reader.onload = function() {
            socket.emit('change-word-set', {
                roomname: roomname,
                username, username,
                set: 'custom',
                filestring: reader.result,
                filename: filename,
            });
        };
        
        reader.onerror = function() {
            console.log(reader.error);
        };
    });
}
