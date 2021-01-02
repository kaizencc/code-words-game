displayAlert();

function displayAlert() {
    var alert = document.getElementById("alert");
    console.log(alert.innerHTML)
    const name = alert.getAttribute("name")
    console.log(alert.getAttribute("name"))
    if (name == "none") {
        alert.style.display = "none"
    } else if (name == "join-fail") {
        alert.style.display = "block"
        alert.innerHTML = "Room does not exist"
    } else {
        alert.style.display = "block"
        alert.innerHTML = "Room already exists"
    }
    
}