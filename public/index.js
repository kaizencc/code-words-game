displayAlert();

function displayAlert() {
    var alert = document.getElementById("alert");
    console.log(alert.innerHTML)
    const name = alert.getAttribute("name")
    console.log(alert.getAttribute("name"))
    if (name == "none") {
        alert.style.display = "none"
    } else if (name == "join-does-not-exist") {
        alert.style.display = "block"
        alert.innerHTML = "Room does not exist"
    } else if (name == "join-username-exists") {
        alert.style.display = "block"
        alert.innerHTML = "Username already exists"
    } else if (name == "create-already-exists") {
        alert.style.display = "block"
        alert.innerHTML = "Room already exists"
    }
    
}