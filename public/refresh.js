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

    // Saved time.
    setTime();

    // Saved word set.
    setWordSet();

}

function setSavedScore(){
    redTeam.innerHTML = sessionStorage.getItem('redscore');
    blueTeam.innerHTML = sessionStorage.getItem('bluescore');
}

function setSavedBroadcast(){
    console.log("BROADCAST",sessionStorage.getItem('broadcast-msg'),sessionStorage.getItem('broadcast-color'));
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
        clock(sessionStorage.getItem('time-for'),Number(sessionStorage.getItem('time'))-2);
    }
}

function setSavedDisplay(){
    console.log("DISPLAY",sessionStorage.getItem('display'));
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