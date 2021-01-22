/************************************************************************************
 *                              Refresh Helper Functions
 ***********************************************************************************/

function returnToGameState(){
    console.log('restoring');
    sessionStorage.setItem('restore','0');

    // Saved score.
    setSavedScore();

    // Saved turn broadcast.
    setSavedBroadcast();

    // Saved time.
    setSavedTime();

    // Saved display status.
    setSavedDisplay();

}

function setSavedScore(){
    redTeam.innerHTML = sessionStorage.getItem('redscore');
    blueTeam.innerHTML = sessionStorage.getItem('bluescore');
}

function setSavedBroadcast(){
    if (sessionStorage.getItem('broadcast-msg')){
        changeBroadcast(sessionStorage.getItem('broadcast-msg'), null);
        if (sessionStorage.getItem('broadcast-color') === "red"){
            makeBroadcastRed();
        } else {
            makeBroadcastBlue();
        }
    } 
}

function setSavedTime(){

}

function setSavedDisplay(){
    switch(sessionStorage.getItem('display')){
        case "start":
            console.log("I'm here");
            showStartDisplay();
            unlockRoles();
            unlockTeams();
            turnOffButtons();
            break;
        case "form":
            showFormDisplay();
            lockRoles();
            lockTeams();
            turnOffButtons();
            break;
        case "clue":
            showClueDisplay();
            lockRoles();
            lockTeams();
            turnOnButtons();
            break;
        case "idle":
            showIdleDisplay();
            lockRoles();
            lockTeams();
            turnOffButtons();
            break;
    }
}