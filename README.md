# Welcome to Code Words Game

## Inspiration

This is my take on the popular game, Code Words. I played it every week online with my family during the months of quarantine in 2020. We would play on the website [http://codewordsgame.com](http://codewordsgame.com), which serves as the initial inspiration for this project. However, I came across frustrating issues on that version where my timer was often incorrect leading to me missing the deadline for my code. I decided it would be worthwhile to create a similar version of the game with my own personal take. 

I started my project by following a [tutorial](https://medium.com/better-programming/building-a-chat-application-from-scratch-with-room-functionality-df3d1e4ef662) to build a chat app. I continued by overhauling the CSS to **Bootstrap** and adding the **MongoDB** database for persistent storage.

## Technology Stack

To design the frontend, I used **Bootstrap** – I was semi-familiar with **Bootstrap** and **React/ElasticUI** but since I knew I needed a multiple page website I went with **Bootstrap**. I also used the **EJS** template to build the HTML.

On the server side, I used **Node.js** with the **Express.js** web framework. **Express.js** helped me manage HTTP requests in the **Node.js** server. In addition, the node modules **body-parser** was used fo rhte middleware and **Socket.io** to communicate between the server and the (potentially) many browser rooms.

Finally, the database was handled by **MongoDB**. After lots of research, I turned to **MongoDB** because its document style database was similar to Javascript objects (JSON) and its free tier was more than enough for me. I used **MongoDB Atlas** to manage my database.

## Some Thoughts

  - Migrating from my initial psuedo-database of Javascript object storages to **MongoDB** was not trivial and took two days. I had to learn what `async` and `await` were and how to use it to my advantage.
  - If I were to start from scratch, I certainly would have used **Typescript** over **Javascript**. Often I wanted to keep my code more legible by declaring the types of my parameters but could not do so. By the time I realized this, I was in too deep.
  - I also could have spent more time researching a well-documented stack. I started with a vanilla tutorial and only considered a database from there. I should have started with full knowledge of the stack I was going to try, like the **MERN** stack. Funnily enough, I ended up quite close to that stack anyway.

## Using this Repository

Just clone the repository and run `node install` and then `node app.js` in the terminal.
