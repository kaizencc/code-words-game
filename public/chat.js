const output = document.getElementById('output');
const message = document.getElementById('message');
const send = document.getElementById('send');
const feedback = document.getElementById('feedback');
const roomMessage = document.getElementById('room-message');
const users = document.querySelector('.users');

//Socket server URL
const socket = io.connect('http://localhost:3000');

//Fetch URL Params from URL
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const username = urlParams.get('username');
const roomname = urlParams.get('roomname');
console.log(username, roomname);

// Display the roomname the user is connected to.
roomMessage.innerHTML = `${roomname} Chat`;

// Emitting username and roomname of newly joined user to server.
socket.emit('joined-user', {
    username: username,
    roomname: roomname
})

// Sending data when user clicks send.
send.addEventListener('click', () =>{
    socket.emit('chat', {
        username: username,
        message: message.value,
        roomname: roomname,
        event: "chat",
    })
    message.value = '';
})

// Allow the enter key to send a message.
window.addEventListener('keypress', function(e){
    if(e.key === "Enter"){
        document.getElementById('send').click();
    }
})

// Sending username if the user is typing.
message.addEventListener('keypress', () => {
    socket.emit('typing', {username: username, roomname: roomname})
})

// Displaying if new user has joined the room.
socket.on('joined-user', (data)=>{
    output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Joined the Room</em></p>';
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

// Displaying if a user disconnects from the room.
socket.on('disconnected-user', (data)=>{
    output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>has Left the Room</em></p>';
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

// Clear all messages.
socket.on('clear-messages', () => {
    output.innerHTML = "";
})

// Display button clicks, switched users, and messages.
socket.on('chat', (data) => {
    if (data.event === "button"){
        output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>clicked ' + data.message + '</em></p>';
    } else if (data.event === "switch") {
        output.innerHTML += '<p>--> <strong><em>' + data.username + ' </strong>switched to ' + data.message + '</em></p>';
    } else if (data.event === "chat" && data.message != ""){
        output.innerHTML += '<p><strong>' + data.username + '</strong>: ' + data.message + '</p>';
        feedback.innerHTML = '';
    }
    document.getElementById('chat-message').scrollTop = document.getElementById('chat-message').scrollHeight;
})

// Displaying if a user is typing.
socket.on('typing', (user) => {
    feedback.innerHTML = '<p><em>' + user + ' is typing...</em></p>';
})

// Displaying online users.
socket.on('online-users', (data) =>{
    users.innerHTML = ''
    data.forEach(user => {
        users.innerHTML += `<p>${user}</p>`
    });
})