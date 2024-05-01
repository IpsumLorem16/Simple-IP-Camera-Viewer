function onCreated(windowInfo) {
  console.log(`Created window: ${windowInfo.id}`);

}

function onError(error) {
  console.log(`Error creating window: ${error}`)
}

browser.browserAction.onClicked.addListener((tab) => {
  console.log('click')

  let popupURL = browser.runtime.getURL("popup/popup.html");

  let creating = browser.windows.create({
    url: popupURL,
    type: "normal",
    height: 500,
    width: 700
  })
  creating.then(onCreated, onError);
})