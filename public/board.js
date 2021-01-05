var words = ['one', 'two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twentyone','twentytwo','twentythree','twentyfour','twentyfive'];

function createBoard() {
    for (var i = 0; i < words.length; i++) {
       var btn = document.createElement("button");
       btn.style.width = "18%";
       btn.style.height= "20%";
       btn.className = "btn btn-warning m-1 p-auto";
       var t = document.createTextNode(words[i]);
       btn.appendChild(t);
       document.getElementById('board').appendChild(btn);
    }
}