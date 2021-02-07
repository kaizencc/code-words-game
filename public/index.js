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
    } else if (name == "join-does-not-exist") {
        alert.style.display = "block";
        alert.innerHTML = "Room does not exist"
    } else if (name == "join-username-exists") {
        alert.style.display = "block";
        alert.innerHTML = "Username already exists"
    } else if (name == "create-already-exists") {
        alert.style.display = "block"
        alert.innerHTML = "Room already exists";
    }
    
}

/**
 * Clear session storage from rooms when on home page.
 */
window.onload = function () {
    sessionStorage.clear();
}
