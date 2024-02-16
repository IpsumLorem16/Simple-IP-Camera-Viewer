
# ![IP Camera](./icons/iconSVG.svg) Simple IP camera Viewer
Simple web extension, to develop new features for full version.

View your IP camera in the browser. Views MJPEG, or JPG snapshot. Should work with most ONVIF cameras and others. 

## Features:

- Fullscreen View
- Take and Immedietly download a snapshot using the snapshot button
- Can open and view on multiple windows
- Will warn if connection problems

## Troubleshooting

- Connection ERROR!  
  There is a problem trying to load the image from your camera, check the supplied url in another tab.
  
- Requires password to acess  
 you can often add credentials within the url like so: "<pass>:<username>@192.168.1.45/getImage.cgi"

- Invalid SSL certificate  
  Open the url on a new tab, within the warning click 'advanced' then ignore and continue.
  if you continue to have issues there is a setting within the broswer that will ignore certificate errors on localhost

- Still cannot view the image
  You may need a cookie, log in to you camera from another tab, then see if you can acess the image url.


To run: go into project folder and type:  
```web-ext run```  
Then press new Icon in Firefox to open a new page and load the extension.

enter scource of image as URl
