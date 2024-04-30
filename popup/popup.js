const userData = {
  lastUsedUrl: '',
  getLastUrl: function(){
    return browser.storage.local.get("userUrl")
  },
  saveUrl: function(url){
    const userUrl = { value:url || '' }
    const onError = (e)=>{console.log(e.message)};

    browser.storage.local.set({userUrl}).catch(onError);
  },
  async populateUrlInput(){
    try {
      let savedData = await this.getLastUrl();
      this.lastUsedUrl = savedData?.userUrl?.value || '';
    } catch (error) {
      console.log(error)
      this.lastUsedUrl = '';
    } finally {
      if (this.lastUsedUrl?.length > 0) {
        const inputEl = document.getElementById('url');
        inputEl.value = this.lastUsedUrl;
      }
    }
  },
  init(){
    this.populateUrlInput();
  }
}
userData.init();

/** Url input form **/
urlForm = {
  formEl: document.getElementById('urlForm'),
  urlInput: document.getElementById('url'),
  urlSubmitBtn: document.querySelector('#urlForm button'),
  headerEl: document.querySelector('.header'),

  checkFileType(fileUrl) {
    return new Promise((resolve, reject) => {
      targetPage = fileUrl;
      setHeaderListener();
      console.log(targetPage);
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
  }, 
  // Alternative checkFileType, does not work for mjpeg (yet)
  // Will show password dialog, if snapshot url needs auth 
  /*   
  checkFileType(fileUrl) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', fileUrl, true);
      xhr.responseType = 'blob';
      xhr.withCredentials = true;
  
      xhr.onload = function() {
        if (xhr.status === 200) {
          const contentType = xhr.getResponseHeader('Content-Type');
          if (contentType.startsWith('image')) {
            resolve(true); // Image loaded successfully, it's an image file
          } else {
            reject({ isImage: false, message: 'File is not an image' });
          }
        } else {
          reject({ isImage: false, message: 'Failed to load file' });
        }
      };
  
      xhr.onerror = function() {
        reject({ isImage: false, message: 'XHR request failed' });
      };
  
      xhr.send();
    }); 
  },  */
  setFormDisable(newState) {
    this.urlInput.disabled = newState;
    this.urlSubmitBtn.disabled = newState;
  },
  hideForm() {
    this.headerEl.classList.add('hide');
    this.formEl.classList.add('hide');
    userMessage.messageEl.classList.add('hide');
    userMessage.isVisible && userMessage.hideMessage();
  },
  showForm() {
    this.headerEl.classList.remove('hide');
    this.formEl.classList.remove('hide');
    userMessage.messageEl.classList.add('hide');
    this.setFormDisable(disabled=false);
    this.urlInput.value = userData.lastUsedUrl;
  },
  handleUrlFormSubmit(e) {
    const urlInput = e.target[0];
    const url = encodeURI(urlInput.value);
    // check file type
    if (url) {
      this.setFormDisable(disabled = true);
      this.checkFileType(url)
        .then(isImage => { //url is an image that be be loaded
          cameraViewer.imageEl.src = url;
          this.hideForm();
          urlInput.value = ''; //clear input on page
          cameraViewer.init(url);
          userData.saveUrl(url);
        })
        .catch(error => { //error getting image from url
          this.setFormDisable(disabled = false);
          console.error('Error', error.message)
          userMessage.new('Check URL in another tab, it needs to be an image');
        })
    }
  },
  init: function() {
    this.formEl.addEventListener('submit', (e)=> {
      e.preventDefault();
      this.handleUrlFormSubmit(e);
    });
  }
}
urlForm.init();
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
    hidePauseImg(); //hide MJPEG paused image
  },
  pause: function() {
    this.playing = false;
    this.loading = false;
    // if mjpeg set img src to bloburl
    if (optionsMenu.mjpegEnabled) {
      setPauseImg();    
    }
  },
  _updateImage: function() {
    if (this.playing === true) {     
      let urlContainsParams = this.url.includes('?');
      let cachebuster = `${(urlContainsParams ? '&' : '?')}cacheBuster=${Date.now()}`;
      this._newImage = new Image();
      const imgUrl =  `${this.url}${cachebuster}`;
      // this._newImage.src = `${this.url}?cacheBuster=${Date.now()}`;
      // this._newImage.src = `${this.url}${cachebuster}`;
      // targetPage = imgUrl;
      setHeaderListener();
      this._newImage.src = imgUrl;
      this._loading = true;
      // if not MJPEG:
      // if (!optionsMenu.mjpegEnabled) {
        this._newImage.onload = () => this._handleImgLoad();
        this._newImage.onerror = () => this._handleImgError();
      // } else {
      //   this._monitorMJPEGStream();
      // }
    }
  },
  _handleImgLoad: function() {
    if(this.playing === true && this._loading === true) {
      this._connectionErrHandler(isRequestError = false);
      this.imageEl.src = this._newImage.src;
      this._loading = false;
      if (!optionsMenu.mjpegEnabled) {
        window.requestAnimationFrame(this._updateImage.bind(this));
      } else {
        this._monitorMJPEGStream();
      }
    }
  },
  _handleImgError: function() {
    this._connectionErrHandler(isRequestError = true);
    window.requestAnimationFrame(this._updateImage.bind(this));
  },
  _mjpegTimeout: null,
  _monitorMJPEGStream: async function() {
    clearTimeout(this._mjpegTimeout);
    if (optionsMenu.mjpegEnabled && cameraViewer.playing) {
      try {
        await this.imageEl.decode();
        console.log('MJPEGmon: image decoded!');
      } catch { // Error decoding MJPEG
        console.log('MJPEGmon: err! image NOT decoded..');
        this._connectionErrHandler(isRequestError = true, null ,force=true); //show error
        window.requestAnimationFrame(this._updateImage.bind(this)); // reload MJPEG
      }
      // restart MJPEG monitor
      this._mjpegTimeout = setTimeout(()=>{this._monitorMJPEGStream()},5000)
    }
  },
  showPlayer: function() {
    this.cameraContainerEl.classList.remove('hide');
    document.querySelector('.main-container').classList.add('player-visible');
    document.body.classList.add('brighter-background');
    urlForm.hideForm();
  },
  hidePlayer: function() {
    this.cameraContainerEl.classList.add('hide')
    document.querySelector('.main-container').classList.remove('player-visible');
    document.body.classList.remove('brighter-background');
    this.pause();
    urlForm.showForm();
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
  _connectionErrHandler: function(isRequestError, error, force=false){
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
    } else if (this._failedImgRequests > 3 || force) {
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
cameraControls = {
  play: {
    element: document.getElementById('playPauseBtn'),
    onClick(event){
      //Play or pause live View
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
    },
  },
  snapshot: {
    element: document.getElementById('snapshotBtn'),
    onClick() {
      triggerScreenshotEffect();
      let img = cameraViewer.imageEl;
      // Create canvas same size as img
      let canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      // Add img to it
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Create blob, and download image
      canvas.toBlob(function (blob) {
        let link = document.createElement('a');
        link.download = `${getDateTimeText()}.jpg`;

        link.href = URL.createObjectURL(blob);
        link.click();

        URL.revokeObjectURL(link.href);
      }, 'image/jpeg');
    },
  },
  fullscreen: {
    element: document.getElementById('fullscreenBtn'),
    onClick(){
      cameraViewer.toggleFullscreen();
    },
  },
  init() {
    this.play.element.addEventListener('click', this.play.onClick);
    this.snapshot.element.addEventListener('click', this.snapshot.onClick);
    this.fullscreen.element.addEventListener('click', this.fullscreen.onClick);
  }
}
cameraControls.init();

// Options button + menu
// Currently Disabled. 
optionsMenu = {
  menuEl: null,
  optionsBtn: null,
  isExpanded: false,
  cachebusterEnabled: true, //true is default setting
  mjpegEnabled: false,
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
    this.mjpegEnabled = newSetting;
    
    //cameraViewer needs updateImage loop restarted when returning to jpeg snapshots
    if ((newSetting == false) && cameraViewer.playing) {
      cameraViewer.play(); 
    }
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

    this._addClickToClose();
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
  _addClickToClose(){
    document.addEventListener('click', (e) => {
      if (!(e.target.classList.contains('menuitem')) && !(e.target.classList.contains('options-overlay')) && !(e.target.id === 'optionsBtn')) {
        this.hide()
      } else {
        this._addClickToClose();
      }
    }, { once: true });
  },
  toggleVisible: function(e) {
    e.stopPropagation();
    const isExpanded = this.optionsBtn.getAttribute('aria-expanded') === 'true' ? true : false;
    isExpanded ? this.hide() : this.show();
  },
  init: function(){
    this.menuEl = document.querySelector('.options-menu');
    this.menuWrapper = document.getElementById('optionsOverlay');
    this.optionsBtn = document.getElementById('optionsBtn');
    this.menuEl.addEventListener('click', (e) => this.handleClick(e));
    this.optionsBtn.addEventListener('click', (e) => this.toggleVisible(e));
  }
}
optionsMenu.init();


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
  const allowOrigin = {
    "name" : "Access-Control-Allow-Origin",
    "value": "*"

  };
  const allowCredentials = {
    "name" : "Access-Control-Allow-Credentials",
    "value": "true"
  };
  e.responseHeaders.push(allowOrigin);
  e.responseHeaders.push(allowCredentials);
  console.log('header');
  browser.webRequest.onHeadersReceived.removeListener(setHeader);
  return {responseHeaders: e.responseHeaders};
}
// let targetPage; 

function setHeaderListener() {
  browser.webRequest.onHeadersReceived.addListener(
    setHeader,
    {urls: ["<all_urls>"]},
    // { urls: [targetPage] },
    ["blocking", "responseHeaders"]
  )
}
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
const cameraContainerEl = cameraViewer.cameraContainerEl;
const snapOverlay = document.querySelector('.snap-overlay');

function triggerScreenshotEffect() {

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

const setPauseImg = () => {
  let img = cameraViewer.imageEl;
  const pausedImgEl = document.querySelector('.paused-img');
  // Create canvas same size as img
  let canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  // Add img to it
  let ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  // Create blob
  canvas.toBlob(function (blob) {
    // Create new image from blob
    const url = URL.createObjectURL(blob);
    const newImg =  new Image();
    newImg.src = url;
    // Wait for image to load/decode then add to page
    newImg.decode().then(() => {
      pausedImgEl.src = url;
      cameraViewer.imageEl.classList.add('hide');
      pausedImgEl.classList.remove('hide');

      URL.revokeObjectURL(url);
    })
  }, 'image/jpeg');
}

const hidePauseImg = () => {
  const pausedImgEl = document.querySelector('.paused-img');
  pausedImgEl.classList.add('hide');
  cameraViewer.imageEl.classList.remove('hide');
}