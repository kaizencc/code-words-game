const canvasEl = document.querySelector('#canvas');

const w = canvasEl.width = window.innerWidth;
const h = canvasEl.height = window.innerHeight * 2;

function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0,0,w,h);
    
    confs.forEach((conf) => {
        conf.update();
        conf.draw();
    })
}

function Confetti () {
  //construct confetti
  const colors = ['#fde132', '#009bde', '#ff6b00','#009d00', '#800080'];
  
  this.x = Math.round(Math.random() * w);
  this.y = Math.round(Math.random() * h)-(h/2);
  this.rotation = Math.random()*360;

  const size = Math.random()*(w/60);
  this.size = size < 15 ? 15 : size;

  this.color = colors[Math.floor(colors.length * Math.random())];

  this.speed = this.size/7;
  
  this.opacity = Math.random();

  this.shiftDirection = Math.random() > 0.5 ? 1 : -1;
}

// Once the confetti has reached the bottom, move it below the page for the effect of disappearing.
Confetti.prototype.border = function() {
  if (this.y >= h) {
    this.y = h + 100;
  }
}

// Each update moves the confetti down and rotates it slightly.
Confetti.prototype.update = function() {
  this.y += this.speed;
  
  if (this.y <= h) {
    this.x += this.shiftDirection/3;
    this.rotation += this.shiftDirection*this.speed/100;
  }

  if (this.y > h) this.border();
};

// Redraw the confetti each time.
Confetti.prototype.draw = function() {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, this.rotation, this.rotation+(Math.PI/2));
  ctx.lineTo(this.x, this.y);
  ctx.closePath();
  ctx.globalAlpha = this.opacity;
  ctx.fillStyle = this.color;
  ctx.fill();
};

const ctx = canvasEl.getContext('2d');
const confNum = Math.floor(w / 4);
var confs = new Array(confNum).fill().map(_ => new Confetti());

function resetConfetti(){
    confs = new Array(confNum).fill().map(_ => new Confetti());
}

/**
 * This should be the only function called from confetti.js.
 * Each call will create a new array of confetti at the top of the container,
 * and then the animation loop will have them slowly fall to the bottom of the container.
 */
function runAnimation(){
    resetConfetti();
    loop();
}
 