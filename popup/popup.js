/* To do: 
  > Tidy code [ ]
    - Url form [ ]
    - Control buttons [ ]
*/
const UserUrl = {
  inputEl: document.getElementById('url'),
  lastUsedUrl: '',
  getLastUrl: function(){
    return browser.storage.local.get("userUrl")
  },
  save: function(url){
    const userUrl = { value:url || '' }
    const onError = (e)=>{console.log(e.message)};

    browser.storage.local.set({userUrl}).catch(onError);
  },
  async init(){
    try {
      let savedData = await this.getLastUrl();
      this.lastUsedUrl = savedData?.userUrl?.value || '';
    } catch (error) {
      console.log(error)
      this.lastUsedUrl = '';
    } finally {
      if (this.lastUsedUrl?.length > 0) {
        this.inputEl.value = this.lastUsedUrl;
      }
    }
  }
}
UserUrl.init();

/** Url input form **/

const urlForm = document.getElementById('urlForm');
const urlInput = document.getElementById('url');
const urlSubmitBtn = urlForm.querySelector('button');
const camIconImg = document.querySelector('.cam-header-img');
const titleEl = document.querySelector('h1');

const checkFileType = (fileUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let loadTimeout;
    img.onload = function() {
      clearTimeout(loadTimeout);
      resolve(true); // Image loaded successfully, it's an image file
    };
    img.onerror = function(e) {
      clearTimeout(loadTimeout);
      reject({isImage:false, message: 'failed'}); // Error loading the image, it's not an image file
    };
    loadTimeout = setTimeout(()=>{
      reject({isImage:false, message:'Took too long to load'}); //Took too long to resolve
    },20000) //20s
    img.src = fileUrl;
  })
} 

const setFormDisable = (newState) => {
  urlInput.disabled = newState;
  urlSubmitBtn.disabled = newState;
}

const hideForm = () => {
  camIconImg.classList.add('hide');
  titleEl.classList.add('hide');
  urlForm.classList.add('hide');
  userMessage.messageEl.classList.add('hide');
  userMessage.isVisible && userMessage.hideMessage();
}
const showForm = () => {
  camIconImg.classList.remove('hide');
  titleEl.classList.remove('hide');
  urlForm.classList.remove('hide');
  userMessage.messageEl.classList.add('hide');
  setFormDisable(disabled=false);
}

const handleUrlFormSubmit = (e) => {
  const urlInput = e.target[0];
  const url = encodeURI(urlInput.value);
  // check file type
  if (url) {
    setFormDisable(disabled=true);
    checkFileType(url)
      .then(isImage => { //url is an image that be be loaded
        cameraViewer.imageEl.src = url;
        hideForm();
        urlInput.value = ''; //clear input on page
        cameraViewer.init(url);  
        UserUrl.save(url);
      })
      .catch(error => { //error getting image from url
        setFormDisable(disabled=false);
        console.error('Error', error.message)
        userMessage.new('Check URL in another tab, it needs to be an image');
      })    
  }
}

urlForm.addEventListener('submit', (e)=> {
  e.preventDefault();
  handleUrlFormSubmit(e);
})
/** End of Url input form **/


/** Camera viewer **/
let cameraViewer = {
  cameraContainerEl : document.querySelector('.camera-container'),
  imageEl: document.querySelector('.camera-container').children[0],
  _newImage: null,
  _loading:false,
  _failedImgRequests: 0,
  _connectionErr: false,
  url : null,
  playing: false,
  isFullscreen: false,
  play: function() {
    this.playing = true;
    this._updateImage();
  },
  pause: function() {
    this.playing = false;
    this.loading = false;
  },
  _updateImage: function() {
    if (this.playing === true) {     
      let urlContainsParams = this.url.includes('?');
      let cachebuster = `${(urlContainsParams ? '&' : '?')}cacheBuster=${Date.now()}`;
      this._newImage = new Image();
      // this._newImage.src = `${this.url}?cacheBuster=${Date.now()}`;
      this._newImage.src = `${this.url}${cachebuster}`;
      this._loading = true;
      
      this._newImage.onload = () => this._handleImgLoad();
      this._newImage.onerror = () => this._handleImgError();
    }
  },
  _handleImgLoad: function() {
    if(this.playing === true && this._loading === true) {
      this._connectionErrHandler(isRequestError = false);
      this.imageEl.src = this._newImage.src;
      this._loading = false;
      window.requestAnimationFrame(this._updateImage.bind(this));
    }
  },
  _handleImgError: function() {
    this._connectionErrHandler(isRequestError = true);
    window.requestAnimationFrame(this._updateImage.bind(this));
  },
  showPlayer: function() {
    this.cameraContainerEl.classList.remove('hide');
    document.querySelector('.main-container').classList.add('player-visible');
    document.body.classList.add('brighter-background');
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
  _connectionErrHandler: function(isRequestError, error){
    isRequestError ? this._failedImgRequests++ : this._failedImgRequests = 0;

    // if no problem, and connection err flag is not set, return
    if(this._failedImgRequests === 0 && !this._connectionErr) {
      return;
      // if no problem, but err flag is not removed
    } else if (this._failedImgRequests === 0 && this._connectionErr) {
      //reset & remove connection error
      this._connectionErr = false;
      this.cameraContainerEl.setAttribute('data-connection-err', false);
      //If connection problem
    } else if (this._failedImgRequests > 3) {
      // set flag and show connection error
      this._connectionErr = true;
      this.cameraContainerEl.setAttribute('data-connection-err', true);
    } 
  },
  init: function(url) {
    this.url = url;
    delete this.imageEl; 
    delete this.cameraContainerEl;
    this.cameraContainerEl = document.querySelector('.camera-container'); //cache element
    this.imageEl = document.querySelector('.camera-container').children[0]; //cache element
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
    cameraViewer.pause();
    button.setAttribute('data-state', 'play');
    button.title = 'Play';
  } else if (state === 'play') {
    cameraViewer.play()
    button.setAttribute('data-state', 'pause');
    button.title = 'Pause';
  }
  MouseIdleTracker.showControls();
})

// Take snapshot
// Grabs currently displayed image, and downloads automatically
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
    link.download = `${getDateTimeText()}.jpg`;
    
    link.href = URL.createObjectURL(blob);
    link.click();
    
    URL.revokeObjectURL(link.href);
  }, 'image/jpeg');
})

//Toggle fullscreen
fullscreenBtn.addEventListener('click', (e)=>{
  cameraViewer.toggleFullscreen();
})

// Options button + menu
// Currently Disabled. 
optionsMenu = {
  menuEl: null,
  optionsBtn: null,
  isExpanded: false,
  cachebusterEnabled: true, //true is default setting
  handleClick: function(e){
    const target = e.target;
    let option = target.getAttribute('data-option');

    if (option !== null) {
      (target.getAttribute('role') === 'menuitemcheckbox') && this.toggleSwitch(target);
    }
  },
  toggleSwitch: function(target){
    let option = target.getAttribute('data-option');
    let isChecked = target.getAttribute('aria-checked');
    let newAtrribute = isChecked == 'true' ? false : true;
    target.setAttribute('aria-checked', newAtrribute);

    // handle the relevent option switched
    switch(option){
      case 'cachebuster':
        this.handleCachebuster(newAtrribute);
      case 'mjpeg':
        this.handleMJPEG(newAtrribute);
    }
  },
  handleMJPEG: function(newSetting){
    console.log('handleMJPEG'+newSetting);
  },
  handleCachebuster: function(newSetting){
    console.log('handleCachebuster'+newSetting);
    this.cachebusterEnabled = newSetting;
  },
  show: function() {
    this.optionsBtn.setAttribute('aria-expanded', 'true');
    this.menuWrapper.classList.remove('fadeOut');
    this.menuWrapper.classList.add('expanded');
    this.isExpanded = true;
  },
  hide: function()  {
    this.optionsBtn.setAttribute('aria-expanded', 'false');
    this.isExpanded = false;
    this.menuWrapper.classList.add('fadeOut');
    
    this.menuWrapper.addEventListener('animationend', (e)=> {
      if (this.optionsBtn.getAttribute('aria-expanded') === 'false') {
        this.menuWrapper.classList.remove('expanded');
      }
    }, {once:true})
  },
  toggleVisible: function() {
    const isExpanded = this.optionsBtn.getAttribute('aria-expanded') === 'true' ? true : false;
    isExpanded ? this.hide() : this.show();
  },
  init: function(){
    this.menuEl = document.querySelector('.options-menu');
    this.menuWrapper = document.getElementById('optionsOverlay');
    this.optionsBtn = document.getElementById('optionsBtn');
    this.menuEl.addEventListener('click', (e) => this.handleClick(e));
    this.optionsBtn.addEventListener('click', () => this.toggleVisible());
  }
}
// optionsMenu.init();


// Hide camera controls, when mouse stays still.
MouseIdleTracker = {
  timer: null,
  camViewerEl: null,
  camControlsEl: null,
  idleTime: 2500,
  isIdle: false,
  isPaused: false,
  
  onMove: function() {
    clearTimeout(this.timer); // Reset the timer 
    if(this.isIdle) {
      this.isIdle = false;
      this.showControls();
    }
    this.timer = setTimeout(this.onIdle.bind(this), this.idleTime); // Set a new timer 
  },
  onIdle: function() {
    this.isIdle = true;
    if (
      !this.isPaused 
      && cameraViewer.playing 
      && !optionsMenu.isExpanded
    ) { this.hideControls() };  
  },
  showControls: function() {
    this.camViewerEl.classList.remove('mouse-idle');
    this._addControlFocus();
  },
  _removeControlFocus: function() {
    // remove focus from cam-control buttons
    const focusedElement = document.activeElement;
    const isButtonFocused = focusedElement.parentElement?.classList.contains('camera-controls');
    isButtonFocused && focusedElement.blur();  
    // Stop controls being focused while hidden
    const camButtons = this.camControlsEl.querySelectorAll('button');
    camButtons.forEach(button => button.tabIndex = '-1');
  },
  _addControlFocus: function() {
    // re-allow controls being focused
    const camButtons = this.camControlsEl.querySelectorAll('button');
    camButtons.forEach(button => button.tabIndex = '0');
  },
  hideControls: function() {
    this._removeControlFocus();
    this.camViewerEl.classList.add('mouse-idle');  // hide controls & mouse
  },
  init: function() {
    this.camViewerEl = cameraViewer.cameraContainerEl;
    this.camControlsEl = document.querySelector('.camera-controls');
    
    // Add event listener for mouse movement
    this.camViewerEl.addEventListener('mousemove', () => { this.onMove() });

    // Add event listeners for camera controls
    // to pause hiding controls when mouse over them.
    this.camControlsEl.addEventListener('mouseenter', () => { this.isPaused = true });
    this.camControlsEl.addEventListener('mouseleave', () => { this.isPaused = false });

    // Initial setup to start the timer
    this.timer = setTimeout(this.onIdle.bind(this), this.idleTime);
  }
};

MouseIdleTracker.init();

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
    this._isVisible = true
  },
  hideMessage : function() {
    this.messageEl.className = 'visually-hidden msg-container';
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