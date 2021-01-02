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

// Function to return set of occupied rooms
function getRooms(users){
    occupiedRooms = new Set()
    Object.keys(users).forEach((room) => {
        occupiedRooms.add(room)
    })
    return occupiedRooms
}

module.exports = {getUsers, getRooms, users};