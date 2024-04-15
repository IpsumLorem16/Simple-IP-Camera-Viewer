
# ![IP Camera](./icons/iconSVG.svg) Simple IP camera Viewer  
Simple and free Firefox web-extension to view your IP camera in the browser. 

Views MJPEG, or JPG snapshot. Should work with most ONVIF cameras and others. 

## Features:

- Fullscreen View.
- Take and Immedietly download a snapshot using the snapshot button.
- Zero ads, no paywall or any-kind of tracking, contains zero third party scripts.
- Can open and view on multiple windows.
- Will warn if connection problems.
- Remembers last URL used, so you don't need to.
- Extremly simple UI, just a few buttons.  
- Runs offline. Requires no access to the internet, you only need to be connected to the same network as your camera.  

## FAQ

- How do I find my Cameras IP?  
  There are several ways, the simplest and easiest for most is to probably use an app like 'Fing' that will scan your network and show all connected devices.
  
- How do I find my cameras snapshot url or MJPEG stream?  
  You should be able to login to your IP camera directly by entering it's IP address in the browser. There you will probably see it's own viewer, you can right click the displayed image and copy that url. Or dig further into it's settings.   
  
  For some brands it is not this simple, you might need to read the documentation to find the URL. Or even have to google your cameras brand name along with 'snapshot url' or 'MJPEG stream url' (they often use the same url across different models). Then just replace it with your cameras IP adress. (eg: "\<yourIP\>/cgi-bin/getImage.cgi")  
  
- Can I view MJPEG stream?  
  Yes, submit the url and then click the gear icon and change it to MJPEG mode in the pop-up menu.   
  Note: when paused on this setting, while the image freezes, it does not actually stop loading the stream. As there were bugs preventing me from easily restarting the stream.  

- Can I view multiple cameras?  
  Yes. But not in the same window. You can open as many Simple Camera viewer windows as you need though.  
  Just click the camera icon on your toolbar to open another.

- The stream is choppy, how can I improve this?  
  The FPS you get depends on a few things outside of my control: Your network, and your hardware.  

  To improve the network, you could try connecting the Camera to Ethernet to improve its speed. You can also connect your Computer you are viewing on, to Ethernet.  

  You could also try reducing the resolution within your cameras settings. Making the image transferred smaller in filesize and thus faster.  
    
  Some cameras have an option to change the snapshot/mjpeg streas resolution independantly of what is recorded onto its internal SD card, but many dont, if you change it you could be degrading your recording quality. Read your devices documentation if you can.

- Can I use my smartphone/PC webcam as a camera?  
  There are apps and programs out there to turn them into network cameras, which will then give you a snapshot url. 
  
- Why did you make this?  
  This was a project for me to learn how to create web-extension. And to test a simpler version of another app I am developing, with much more features. 

## Troubleshooting

- Connection ERROR!  
  There is a problem trying to load the image from your camera, check the supplied URL in another tab.
  
- Requires password to access  
  you can often add credentials within the url like so: "\<pass\>:\<username\>@192.168.1.45/getImage.cgi"

- Invalid SSL certificate  
  Open the url on a new tab, within the warning click 'advanced' then ignore and continue.
  if you continue to have issues there is a setting within the broswer that will ignore certificate errors on localhost

- Still cannot view the image  
  You may need a cookie, log in to you camera from another tab, then see if you can acess the image url.


## Using
Install via the official Firefox Extension page.  
  
To run locally for development, make sure you have web-ext. Then go into project folder and type:  
```web-ext run```  
  
## Feedback    
Report bugs and feature requests by submitting an issue, any positive feedback please add it to the Firefox extension page.

## Credits  
SVG background from: [svgbackgrounds.com](https://svgbackgrounds.com)    
SVG button icons from [heroicons.com](https://heroicons.com)