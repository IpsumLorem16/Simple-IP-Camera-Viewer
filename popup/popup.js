// for testing only 
document.getElementById('url').value = 'https://root:ismart12@192.168.1.45/cgi-bin/currentpic.cgi'
// userMessage.new('This is Just a test message DO NOT BE ALARMED!', 'warn');

// for testing only end

/** Url input form **/

const urlForm = document.getElementById('urlForm');


const validateUrlForm = (input) => {
//validate url, and make a test connection. 
//show toast, if there is a problem like 404, or unsecure connection error(and how to fix it)
}

const hideForm = () => {
  urlForm.classList.add('hide');
  // hide title
  const titleEl = document.querySelector('h1');
  titleEl.classList.add('hide');
  
}
const showForm = () => {
  urlForm.classList.remove('hide');
  // show title
  const titleEl = document.querySelector('h1');
  titleEl.classList.remove('hide');
}

const handleUrlFormSubmit = (e) => {
  const urlInput = e.target[0];
  hideForm();
  const url = encodeURI(urlInput.value);
  urlInput.value = ''; //clear input on page
  cameraViewer.init(url);
  console.log(url);
  

}

urlForm.addEventListener('submit', (e)=> {
  e.preventDefault();
  // validateUrlForm();
  handleUrlFormSubmit(e);
})
/** End of Url input form **/


/** Camera viewer **/
// To Do: Add connection error handling
let cameraViewer = {
  cameraContainerEl : document.querySelector('.camera-container'),
  imageEl: document.querySelector('.camera-container').children[0], 
  // newImage: null,
  __loading:false,
  url : null,
  playing: false,
  isFullscreen: false,
  play: function () {
    this.playing = true;
    // Recursive function
    const updateImage = () => {
      console.log('updateimage')
      if (this.playing === true) {        
        let newImage = new Image();
        newImage.src = `${this.url}?cacheBuster=${Date.now()}`; //
        this.__loading = true;
        
        newImage.onload = () => {
          console.log('onload')
          if(this.playing === true && this.__loading === true) {
            this.imageEl.src = newImage.src;
            this.__loading = false;
            window.requestAnimationFrame(updateImage);
            console.log('request Animation frame')
          }
        };
      }
    }
    window.requestAnimationFrame(updateImage)
  },
  pause: function() {
    this.playing = false;
    this.loading = false;
  },
  showPlayer: function() {
    this.cameraContainerEl.classList.remove('hide');
    document.querySelector('.main-container').classList.add('player-visible');
    hideForm();
  },
  hidePlayer: function() {
    this.cameraContainerEl.classList.add('hide')
    document.querySelector('.main-container').classList.remove('player-visible');
    showForm();
  },
  toggleFullscreen: function(){
    //Toggles camera-viewer fullscreen and not.
    // relies on event listener added in this.init()
    this.isFullscreen ? document.exitFullscreen() : this.cameraContainerEl.requestFullscreen(); // triggers _onFullscreenChange
  },
  _onFullscreenChange: function(){
    const fullscreenBtnEl = document.getElementById('fullscreenBtn')
    //If fullscreen & element is 'camera-container'
    if (document.fullscreenElement?.classList.contains('camera-container')) {
      this.cameraContainerEl.classList.add('fullscreen');
      this.isFullscreen = true;
      fullscreenBtnEl.title = 'Exit full screen';
    } else {
      this.cameraContainerEl.classList.remove('fullscreen');
      this.isFullscreen = false;
      fullscreenBtnEl.title = 'Full screen';
    }
  },
  init: function(url) {
    this.url = url;
    this.play();
    this.showPlayer();
    this.cameraContainerEl.addEventListener("fullscreenchange", this._onFullscreenChange.bind(this));
  },

}
/** End of Camera Veiwer **/

/** Camera Controls **/
const playPauseBtn = document.getElementById('playPauseBtn');
const snapshotBtn = document.getElementById('snapshotBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');

//Play or pause live view
playPauseBtn.addEventListener('click', (event) => {
  const button = event.target;
  const state = button.getAttribute('data-state');
  if (state === 'pause') {
    console.log('pause button pressed');
    cameraViewer.pause();
    button.setAttribute('data-state', 'play');
    button.title = 'Play';
  } else if (state === 'play') {
    console.log('play button pressed');
    cameraViewer.play()
    button.setAttribute('data-state', 'pause');
    button.title = 'Pause';
  }
})

// Take snapshot
// Grabs currently displayed image, and downloads automatically
//To do: 
// > add visual effect to show snapshot taken. ie: screen flash + large icon on screen
snapshotBtn.addEventListener('click', e => {
  triggerScreenshotEffect();
  let img = cameraViewer.imageEl;
  // // Add image to canvas, and create blob
  let canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  
  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  canvas.toBlob(function(blob) {
    let link = document.createElement('a');
    link.download = `${getDateTimeText()}.png`;
    
    link.href = URL.createObjectURL(blob);
    link.click();
    
    URL.revokeObjectURL(link.href);
  }, 'image/png');
})

//Toggle fullscreen
fullscreenBtn.addEventListener('click', (e)=>{
  cameraViewer.toggleFullscreen();
})

/**End of Camera Controls**/


/** Dismissable Toast **/
//    userMessage.new($text, $type), to display message.
//    $type = 'warn', 'success', or blank for standard.

let userMessage = {
  messageEl:null,//document.getElementById('message'),
  messageTextEl:'', //document.getElementById('msgTxt'),
  closeBtnEl:null, //document.getElementById('message').children[0],
  _text: '',
  _isVisible: false,
  showMessage : function(type) {
    this.messageEl.className = `msg-container ${type}`;
    // this.messageEl.classList.remove('hidden');
    this._isVisible = true
  },
  hideMessage : function() {
    this.messageEl.className = 'hidden msg-container';
    // this.messageEl.classList.add('hidden');
    this._isVisible = false;
  },
  set text(newText) {
    this._text = newText;
    this.messageTextEl.innerText = newText;
  },
  get text() { return this._text },
  onClose : function(e) {
    this.text = ''
    this.hideMessage();
  },
  new: function(message,type) {
    this.text = message
    this.showMessage(type);
  },
  set isVisible(bool) {},
  get isVisible() { return this._isVisible},
  init: function(){
    this.messageEl = document.getElementById('message');
    this.closeBtnEl = this.messageEl.children[0];
    this.messageTextEl = this.messageEl.children[1];  
    this.closeBtnEl.addEventListener('click', this.hideMessage.bind(this));
  }
}
userMessage.init();
/** End of Dismissable Toast **/


/** Modify Headers **/
//    Modify Headers on image requests from webcams
//    Removes CORS restrictions, allowing us to modify and save images
//    Requires host_permissions in manifest:
//      "webRequest", "webRequestBlocking", "<all_urls>"
function setHeader(e) {
  console.log("header Handler")
  const newHeader = {
    "name" : "Access-Control-Allow-Origin",
    "value": "*"
  };
  e.responseHeaders.push(newHeader);
  return {responseHeaders: e.responseHeaders};
}

browser.webRequest.onHeadersReceived.addListener(
  setHeader,
  {urls: ["<all_urls>"]},
  ["blocking", "responseHeaders"]
)
/** End of Modify Headers **/

// Helper functions:

// Returns filename safe, current date and time
function getDateTimeText() {
  const date = new Date;
  let dateTxt = date.toDateString().replaceAll(" ", "-"); //output: "Wed-Jul-28-2023"
  let timeTxt = `${date.toTimeString().slice(0,6).replaceAll(":","")}-${date.getSeconds()}s`; // "1745-34s"
  let dateTimeTxt = `${dateTxt}_${timeTxt}`; // "Wed-Jul-28-2023_1745-34s"

  return dateTimeTxt;
}

// Show User screenshot button has been pressed via visual effect.
let currAnimation = 'fadeOutGrow'

function triggerScreenshotEffect() {
  const cameraContainerEl = cameraViewer.cameraContainerEl;
  const snapOverlay = cameraContainerEl.children[2];

  // This is needed to restart the CSS animation, when pressing the button quickly.
  // (It's dumb but works...)
  if (currAnimation === 'fadeOutGrow') {
    snapOverlay.style.animation = 'fadeOutGrow2 500ms';
    currAnimation = 'fadeOutGrow2';
  } else if (currAnimation === 'fadeOutGrow2') {
    snapOverlay.style.animation = 'fadeOutGrow 500ms';
    currAnimation = 'fadeOutGrow';
  }
 
  cameraContainerEl.classList.remove('snapshot-flash');
  cameraContainerEl.classList.add('snapshot-flash');
  
  cameraContainerEl.addEventListener('animationend', ()=>{
    cameraContainerEl.classList.remove('snapshot-flash')
  }, {once:true})

}