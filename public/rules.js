// When the user scrolls the page, execute progressBar
window.onscroll = function() {progressBar()};

/**
 * Increases and decreases the progress bar on rules page.
 */
function progressBar() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100;
  document.getElementById("myBar").style.width = scrolled + "%";
}