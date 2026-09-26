//User uploads song 
//Whichever way they choose communicates with this script use a bool 
//This script unlocks scroll and inserts black sheet and then populates dom with the new page 



function lockScroll() {
  document.body.classList.add('scroll-locked');
  document.body.classList.remove('scroll-unlocked');
}
 
function unlockScroll() {
  document.body.classList.remove('scroll-locked');
  document.body.classList.add('scroll-unlocked');
}

lockScroll();





