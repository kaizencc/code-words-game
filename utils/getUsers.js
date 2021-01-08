// Store connected Users
var users = {}

class Player {
    constructor(socket, username){
        this.socket = socket
        this.username = username
        this.show = false
        this.team = "red"
    }

    flipRole(){
        if(this.show){
            this.show = false;
        } else {
            this.show = true;
        }
    }
}

// Function to reset all roles to field, called when new game is initiated
function resetRoles(room){
    users[room].forEach((onlineUser) => {
        onlineUser.show = false
    })
}

function switchRoles(user, room){
    answer = false;
    users[room].forEach((onlineUser) => {
        if(onlineUser.username === user){
            onlineUser.flipRole();
            answer = onlineUser.show;
        }
    })
    return answer

}

// Funtion to get users online in a room
function getUsers(arr){
    onlineUsers = []
    arr.forEach((onlineUser) => {
        onlineUsers.push(onlineUser.username)
    })
    return onlineUsers
}

function getRoles(arr){
    roles = {}
    arr.forEach((onlineUser) => {
        roles[onlineUser.username] = onlineUser.show
    })
    return roles
}

// Function to return set of occupied rooms
function getRooms(users){
    occupiedRooms = new Set()
    Object.keys(users).forEach((room) => {
        occupiedRooms.add(room)
    })
    return occupiedRooms
}

module.exports = {getUsers, getRooms, switchRoles, getRoles, resetRoles, users, Player};