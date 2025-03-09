# LED Board

A digital LED board implementation using Playwright for screenshots and visual effects.

## Features

- Create dynamic LED board displays
- Capture screenshots of websites
- Apply visual effects to images
- Web interface for controlling the LED board

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/Rudra-ravi/ledboard.git
   cd ledboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install Playwright browsers:
   ```
   npx playwright install chromium
   ```

## Usage

Start the application:
```
npm start
```

This will start a web server on http://localhost:3000 where you can control the LED board.

## Scripts

- `src/index.js` - Main entry point
- `src/screenshot.js` - Screenshot capture utility
- `src/effects.js` - Image processing effects
- `src/server.js` - Web server for the UI

## License

MIT