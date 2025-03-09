// @ts-check
const LedBoardServer = require('./server');
const ScreenshotCapture = require('./screenshot');
const EffectsProcessor = require('./effects');
const path = require('path');

/**
 * Main entry point for the LED Board application
 */
async function main() {
  console.log('Starting LED Board application...');
  
  // Create server instance
  const server = new LedBoardServer({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    screenshotsDir: path.join(__dirname, '../screenshots'),
    processedDir: path.join(__dirname, '../processed')
  });
  
  // Start the server
  await server.start();
  
  // If no command line arguments, just start the server
  if (process.argv.length <= 2) {
    return;
  }
  
  // Handle command line arguments for CLI usage
  const command = process.argv[2];
  
  if (command === 'screenshot') {
    // Example: node src/index.js screenshot https://example.com example.png
    if (process.argv.length < 5) {
      console.error('Usage: node src/index.js screenshot <url> <filename> [selector]');
      process.exit(1);
    }
    
    const url = process.argv[3];
    const filename = process.argv[4];
    const selector = process.argv[5]; // Optional
    
    const screenshotCapture = new ScreenshotCapture({
      outputDir: path.join(__dirname, '../screenshots')
    });
    
    try {
      console.log(`Capturing screenshot of ${url}...`);
      const screenshotPath = await screenshotCapture.captureSingle(url, filename, selector);
      console.log(`Screenshot saved to: ${screenshotPath}`);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      process.exit(1);
    }
  } else if (command === 'process') {
    // Example: node src/index.js process input.png output.png
    if (process.argv.length < 5) {
      console.error('Usage: node src/index.js process <input> <output> [brightness] [contrast] [invert]');
      process.exit(1);
    }
    
    const inputFile = process.argv[3];
    const outputFile = process.argv[4];
    const brightness = process.argv[5] ? parseFloat(process.argv[5]) : undefined;
    const contrast = process.argv[6] ? parseFloat(process.argv[6]) : undefined;
    const invert = process.argv[7] === 'true';
    
    const effectsProcessor = new EffectsProcessor({
      outputDir: path.join(__dirname, '../processed')
    });
    
    try {
      console.log(`Processing image ${inputFile}...`);
      const inputPath = path.join(__dirname, '../screenshots', inputFile);
      const processedPath = await effectsProcessor.applyLedEffect(
        inputPath,
        outputFile,
        { brightness, contrast, invert }
      );
      console.log(`Processed image saved to: ${processedPath}`);
    } catch (error) {
      console.error('Error processing image:', error);
      process.exit(1);
    }
  } else if (command === 'text') {
    // Example: node src/index.js text "Hello World" hello.png
    if (process.argv.length < 5) {
      console.error('Usage: node src/index.js text <text> <output>');
      process.exit(1);
    }
    
    const text = process.argv[3];
    const outputFile = process.argv[4];
    
    const effectsProcessor = new EffectsProcessor({
      outputDir: path.join(__dirname, '../processed')
    });
    
    try {
      console.log(`Creating text image for "${text}"...`);
      const textImagePath = await effectsProcessor.createTextImage(text, outputFile);
      console.log(`Text image saved to: ${textImagePath}`);
    } catch (error) {
      console.error('Error creating text image:', error);
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Available commands: screenshot, process, text');
    process.exit(1);
  }
}

// Run the application
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});