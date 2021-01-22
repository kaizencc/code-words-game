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
    if (sessionStorage.getItem('time')){
        startTimer(Number(sessionStorage.getItem('time'))-2, sessionStorage.getItem('time-for'));
    }
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
            setReceivedClue(sessionStorage.getItem('received-clue'));
            lockRoles();
            lockTeams();
            turnOnButtons();
            break;
        case "idle":
            showIdleDisplay();
            setIdleClue(sessionStorage.getItem('idle-clue'));
            lockRoles();
            lockTeams();
            turnOffButtons();
            break;
    }
}