// Store connected Users
var users = {}

// Funtion to get users online in a room
function getUsers(arr){
    onlineUsers = []
    arr.forEach((onlineUser) => {
        onlineUsers.push(Object.values(onlineUser)[0])
    })
    return onlineUsers
}

function getRooms(){
    return Objects.keys(users)
}

module.exports = {getUsers, getRooms, users};