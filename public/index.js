// Enum for index page alert banner
const alertMessage = {
    NONE: 'none',
    JOIN_DOES_NOT_EXIST: 'join-does-not-exist',
    JOIN_USERNAME_EXISTS: 'join-username-exists',
    CREATE_ALREADY_EXISTS: 'create-already-exists',
    CREATE_RESERVED: 'create-reserved',
    BAD_USERNAME: 'bad-username',
    BAD_ROOMNAME: 'bad-roomname',
}

/************************************************************************************
 *                              Home Page Alert
 ***********************************************************************************/

displayAlert();

/**
 * Determine whether to display alert with error message.
 */
function displayAlert() {
    var alert = document.getElementById("alert");
    const name = alert.getAttribute("name")
    if (name == "none") {
        alert.style.display = "none";
    } else if (name == alertMessage.JOIN_DOES_NOT_EXIST) {
        alert.style.display = "block";
        alert.innerHTML = "Room does not exist";
    } else if (name == alertMessage.JOIN_USERNAME_EXISTS) {
        alert.style.display = "block";
        alert.innerHTML = "Username already exists";
    } else if (name == alertMessage.CREATE_ALREADY_EXISTS) {
        alert.style.display = "block";
        alert.innerHTML = "Room already exists";
    } else if (name == alertMessage.CREATE_RESERVED){
        alert.style.display = "block";
        alert.innerHTML = "Roomname is reserved";
    } else if (name == alertMessage.BAD_USERNAME){
        alert.style.display = "block";
        alert.innerHTML = "Username has profanity";
    } else if (name == alertMessage.BAD_ROOMNAME){
        alert.style.display = "block";
        alert.innerHTML = "Roomname has profanity";
    }
}

/**
 * Clear session storage from rooms when on home page.
 */
window.onload = function () {
    sessionStorage.clear();
}
