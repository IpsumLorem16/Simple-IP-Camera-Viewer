// for testing only 
document.getElementById('url').value = 'https://root:ismart12@192.168.1.45/cgi-bin/currentpic.cgi'
// for testing only end

// Url input form
const urlForm = document.getElementById('urlForm');

const validateUrlForm = (input) => {

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

// Camera viewer
let cameraViewer = {
  cameraContainerEl : document.querySelector('.camera-container'),
  imageEl: document.querySelector('.camera-container').children[0], 
  // newImage: null,
  __loading:false,
  url : null,
  playing: false,
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
  init: function(url) {
    this.url = url;
    this.play();
    this.showPlayer();
  },

}

// Camera Controls
const playPauseBtn = document.getElementById('playPauseBtn');
const snapshotBtn = document.getElementById('snapshotBtn');

//Play or pause live view
playPauseBtn.addEventListener('click', (event) => {
  const button = event.target;
  const state = button.getAttribute('data-state');
  if (state === 'pause') {
    console.log('pause button pressed');
    cameraViewer.pause();
    button.setAttribute('data-state', 'play');
  } else if (state === 'play') {
    console.log('play button pressed');
    cameraViewer.play()
    button.setAttribute('data-state', 'pause');
  }
})

//Take snapshot
snapshotBtn.addEventListener('click', e => {
  console.log('snapshot pressed')
  // Grab currently displayed image
  // let img = new Image().src = cameraViewer.imageEl.src;
  let img = cameraViewer.imageEl;
  // Add image to canvas, and create blob
  let canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  canvas.toBlob(function(blob) {
    let link = document.createElement('a');
    link.download = 'snapshot.png';

    link.href = URL.createObjectURL(blob);
    link.click();

    URL.revokeObjectURL(link.href);
  }, 'image/png');
})

//End of Camera Controls





// Dismissable alert/popup.
// userMessage.new($text, $type), to display message.
// $type = 'warn', 'success', or blank for standard.

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
userMessage.new('This is Just a test message DO NOT BE ALARMED!', 'warn');

// Modify Headers on image requests from webcams
// Removes CORS restrictions, allowing us to modify and save images
// Requires host_permissions in manifest
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