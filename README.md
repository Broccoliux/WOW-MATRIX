# WOW MATRIX
8x8x8 LED 3D Matrix

Built by Broccoli > ME <

## what this project is

This project is my WiFi controlled 8x8x8 LED cube thing and honestly it is kinda fire

The app folder is the browser controller and the frimware folder is the ESP32 S3 code and the tiny local web server running on the board

The 3D enclosure is done and the PCB is done too the only part missing on the enclosure is the LED mounts because I am gonna add those once I print the enclosure and test the fit

The main thing still missing right now is the firmware because that is the part that actually makes the cube run for real

## repo layout

```text
WOW MATRIX/
    app/
        index html       browser UI
        script js        3D cube logic controls animations WiFi sending
        style css        page styling and LED visuals
        firmware/        another firmware folder that exists in the app area
    frimware/
        platformio ini   ESP32 S3 PlatformIO config
        src/             ESP32 source files
        data/            files served by the ESP32 web server
    CAD/               cube design files and mechanical work
    imgs/              project images
    Matrix/            KiCad project and PCB related files
```

The real firmware folder is the root frimware not app firmware and that is the one that matters for flashing and deployment

## how the web app works

The browser creates 512 LED objects in JavaScript Each LED has

```text
x = 0 to 7
y = 0 to 7
z = 0 to 7
color = RGB
```

The data is stored in this order

```text
index = z * 64 + y * 8 + x
```

This is basically a visual 3D model of the cube CSS 3D transforms place each LED dot in space and dragging the viewport rotates the whole cube around X Y and Z The LEDs are rendered as little glowing bulbs with a highlight a colored center and a dark socket behind them

## controls in the page

### bulk selection

Use the LED table checkboxes to pick a bunch of voxels choose a color and hit Apply That updates the browser model and sends the frame to the ESP32 when the cube is connected

### animations

The current animation lineup is

- Rain drops fall down the Y axis in every X Z column
- Pulse the whole cube brightens and dims with the selected animation color
- Wave brightness moves through X Y and Z together
- Bouncing Ball a bright ball travels through the cube volume
- Lightning a quick flash path jumps through multiple voxels

The animation color picker is separate from the bulk selection color because changing the bulk color should not silently change the animation color That would be weird and annoying also some animations are still a little rough and I will clean them up later

### image mapper

Use the Image Mapper to load a photo or image The browser draws it into an 8x8 canvas and reads the pixels with Canvas getImageData

There are two modes

- 3D Volume each image pixel is copied across all 8 Z layers so a full 8x8 image can use all 512 LEDs
- Front Face each image pixel only appears on the front face so it uses up to 64 LEDs

Super dark or transparent pixels stay off The original RGB values are preserved per LED so the image does not get flattened into one single color

Loading an image also stops the current animation because the image frame has to stay on the cube

## ESP32 WiFi setup

The ESP32 S3 starts its own WiFi network not the home router Very on brand for a tiny cube project

```text
WiFi name LED_Cube_Controller
Password password123
ESP32 IP 192 168 4 1
```

The ESP32 also runs a DNS server If you type a hostname while connected to the cube WiFi it gets redirected to the board which is how the captive portal works on a lot of phones

If your phone does not auto open the controller just open this manually

```text
http://192 168 4 1
```

Some phones say the WiFi has no internet That is normal Just choose stay connected anyway The cube network is local and does not need internet for the controller to work

## how the ESP32 receives a frame

The browser sends a POST request to

```text
POST /api/frame
```

The request body is base64 text After decoding it has to contain exactly

```text
512 LEDs x 3 bytes = 1536 bytes
```

The bytes are sent in this order

```text
for z 0..7
    for y 0..7
        for x 0..7
            red green blue
```

Other API routes

```text
GET /api/status checks if the ESP32 is alive
POST /api/clear turns the stored frame off
```

The browser sends frames about 30 times per second while connected That limit is intentional so dragging the cube does not spam the ESP32 with a million requests

## upload the firmware and web page

You will need VS Code the PlatformIO extension and the ESP32 platform Open the root firmware folder

```text
F:\OneDrive\Desktop\cloned repos\WOW MATRIX\frimware
```

The board config is already in platformio ini

```ini
[env esp32 s3 devkitc 1]
platform = espressif32
board = esp32 s3 devkitc 1
framework = arduino
monitor_speed = 115200
```

First upload the files in data then upload the program

```bash
cd "F:\OneDrive\Desktop\cloned repos\WOW MATRIX\frimware"
pio run -t uploadfs
pio run -t upload
```

uploadfs pushes data index html data script js and data style css into the ESP32 LittleFS storage upload flashes the C++ firmware onto the board Both are needed

If you change anything in app copy the files into frimware data again before running uploadfs

```bash
copy "F:\OneDrive\Desktop\cloned repos\WOW MATRIX\app\index html" "F:\OneDrive\Desktop\cloned repos\WOW MATRIX\frimware\data\index html"
copy "F:\OneDrive\Desktop\cloned repos\WOW MATRIX\app\script js" "F:\OneDrive\Desktop\cloned repos\WOW MATRIX\frimware\data\script js"
copy "F:\OneDrive\Desktop\cloned repos\WOW MATRIX\app\style css" "F:\OneDrive\Desktop\cloned repos\WOW MATRIX\frimware\data\style css"
```

## what is done

The 3D enclosure is done and the PCB is done

The enclosure is missing the LED mounts for now because I am going to add those once I print the enclosure and test the fit

The main thing that is still missing is the firmware because that is the part that actually makes the cube do stuff in real life

## current status

What is working right now

- 3D 512 LED browser model
- mouse and touch rotation
- individual LED selection
- bulk color selection
- rain pulse wave ball and lightning animations
- custom animation color
- local image loading and 8x8 pixel sampling
- 3D volume image mode
- ESP32 access point setup
- captive portal routes
- status frame and clear HTTP API
- LittleFS web app serving

What is still missing

- final firmware logic to drive the real cube
- testing the real cube frame order against the physical wiring
- LED mounts on the enclosure after the print test

## final vibe

This project is made by Broccoli and that is the real energy

The software side is already pretty solid and the hardware side is basically in place now The 3D enclosure and PCB are done The only real big gap left is the firmware and that is where the focus needs to be next
