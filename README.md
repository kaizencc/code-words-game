# Welcome to Code Words Game

## Inspiration

This is my take on the popular game, Codenames. I played it every week online with my family during the months of quarantine in 2020. We would play on the website [http://codewordsgame.com](http://codewordsgame.com), which serves as the initial inspiration for this project. However, I came across frustrating issues on that version where my timer was often incorrect leading to me running out of time before sending my clue. I decided it would be worthwhile to create a similar version of the game with my own personal take. 

I began this project with no prior experience building websites beyond a simple one-page React app for my personal portfolio. I greatly benefited from having a month free of responsibilities due to Covid-19 (January 2021) to research each step I took thoroughly. I learned so much from this experience (see "Some Thoughts" section below). With the belief that other aspiring developers could find themselves in my shoes at some point, I hope I can help by detailing my journey. 

## My Journey

My game is built off of a [tutorial](https://medium.com/better-programming/building-a-chat-application-from-scratch-with-room-functionality-df3d1e4ef662) to build a chat app. If you visit [cryptonight.codes](https://cryptonight.codes) and play the game you may see a version of the chat still exists. This was a wonderful start for me because it introduced **Socket.io** to me which is perhaps the most important piece of tech that my game runs on. **Socket.io** allows me to communicate to each player in the room and from player back to the server. My first deviation from the tutorial was to overhaul the CSS to **Bootstrap** and add the **MongoDB** database for persistent storage. Baby steps.

Perhaps the most perplexing to me was how to get my game running on a production server. To get the website on a production server I chose to use **AWS** as my cloud provider given my proximity as an 2020 AWS Summer SWE Intern. My application runs on the free-tier t2-micro **EC2** server. I created an **Elastic IP** address to make sure that my EC2 always had the same public IP. I purchased a domain name ($35/year) and used AWS's DNS provider **Route 53** to connect that domain name to my Elastic IP. I also used **nginx** as a reverse proxy to direct both http and https requests to my nodejs server. I recommend following this [tutorial](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-18-04), as I leaned on it heavily and follows the same steps I detailed.

## Technology Stack

To design the frontend, I used **Bootstrap** – I was semi-familiar with **Bootstrap** and **React/ElasticUI** but since I knew I needed a multiple page website I went with **Bootstrap**. I also used the **EJS** template to build the HTML and **Sortable.js** to allow users to drag-and-drop their icons to different teams.

On the server side, I used **Node.js** with the **Express.js** web framework. **Express.js** helped me manage HTTP requests in the **Node.js** server. In addition, the node modules **body-parser** was used fo rhte middleware and **Socket.io** to communicate between the server and the (potentially) many browser rooms.

Finally, the database was handled by **MongoDB**. After lots of research, I turned to **MongoDB** because its document style database was similar to Javascript objects (JSON) and its free tier was more than enough for me. I used **MongoDB Atlas** to manage my database.

## Some Thoughts

  - Migrating from my initial psuedo-database of Javascript object storages to **MongoDB** was not trivial and took two days. I had to learn what `async` and `await` were and how to use it to my advantage.
  - If I were to start from scratch, I certainly would have used **Typescript** over **Javascript**. Often I wanted to keep my code more legible by declaring the types of my parameters but could not do so. By the time I realized this, I was in too deep.
  - I also could have spent more time researching a well-documented stack. I started with a vanilla tutorial and only considered a database from there. I should have started with full knowledge of the stack I was going to try, like the **MERN** stack. Funnily enough, I ended up quite close to that stack anyway.
  - I researched **Colyseus.io** after having completed a signficant portion of my project, so I didn't go in that direction. But the next time I use Node.js to build a game I would certainly start with that open-source library, which is like **socket.io** on steroids and made for online multiplayer games.

## Using this Repository

Just clone the repository and run `node install` and then `node app.js` in the terminal.

If this repository helped you or inspired you, or you're just feeling nice, please consider Starring the repository or contributing a Github Issue!
