function onCreated(windowInfo) {
  console.log(`Created window: ${windowInfo.id}`);

}

function onError(error) {
  console.log(`Error creating window: ${error}`)
}

browser.browserAction.onClicked.addListener((tab) => {
  console.log('click')

  let popupURL = browser.runtime.getURL("popup/popup.html");

  // let creating = browser.windows.create({
  //   url: popupURL,
  //   type: "normal",
  //   height: 500,
  //   width: 700
  // })

  let creating = browser.tabs.create({
    url: popupURL
  })

  creating.then(onCreated, onError);

  
})