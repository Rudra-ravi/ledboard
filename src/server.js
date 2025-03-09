// @ts-check
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const ScreenshotCapture = require('./screenshot');
const EffectsProcessor = require('./effects');

/**
 * Web server for LED board control interface
 */
class LedBoardServer {
  /**
   * Create a new LedBoardServer instance
   * @param {Object} options - Configuration options
   * @param {number} options.port - Server port
   * @param {string} options.screenshotsDir - Directory for screenshots
   * @param {string} options.processedDir - Directory for processed images
   */
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.screenshotsDir = options.screenshotsDir || './screenshots';
    this.processedDir = options.processedDir || './processed';
    
    // Create directories if they don't exist
    [this.screenshotsDir, this.processedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Initialize components
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    
    this.screenshotCapture = new ScreenshotCapture({
      outputDir: this.screenshotsDir
    });
    
    this.effectsProcessor = new EffectsProcessor({
      outputDir: this.processedDir
    });
    
    // Setup routes and socket handlers
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  /**
   * Setup Express routes
   */
  setupRoutes() {
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Serve screenshots and processed images
    this.app.use('/screenshots', express.static(this.screenshotsDir));
    this.app.use('/processed', express.static(this.processedDir));
    
    // Parse JSON request bodies
    this.app.use(express.json());
    
    // API endpoints
    this.app.post('/api/screenshot', async (req, res) => {
      try {
        const { url, filename, selector } = req.body;
        
        if (!url || !filename) {
          return res.status(400).json({ error: 'URL and filename are required' });
        }
        
        const screenshotPath = await this.screenshotCapture.captureSingle(
          url, 
          filename, 
          selector
        );
        
        res.json({ 
          success: true, 
          path: screenshotPath,
          url: `/screenshots/${filename}`
        });
      } catch (error) {
        console.error('Error capturing screenshot:', error);
        res.status(500).json({ error: 'Failed to capture screenshot' });
      }
    });
    
    this.app.post('/api/process', async (req, res) => {
      try {
        const { 
          inputFile, 
          outputFilename, 
          brightness, 
          contrast, 
          invert 
        } = req.body;
        
        if (!inputFile || !outputFilename) {
          return res.status(400).json({ error: 'Input file and output filename are required' });
        }
        
        const inputPath = path.join(this.screenshotsDir, inputFile);
        
        if (!fs.existsSync(inputPath)) {
          return res.status(404).json({ error: 'Input file not found' });
        }
        
        const processedPath = await this.effectsProcessor.applyLedEffect(
          inputPath,
          outputFilename,
          { brightness, contrast, invert }
        );
        
        res.json({ 
          success: true, 
          path: processedPath,
          url: `/processed/${outputFilename}`
        });
      } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Failed to process image' });
      }
    });
    
    this.app.post('/api/text', async (req, res) => {
      try {
        const { 
          text, 
          outputFilename, 
          fontSize, 
          color, 
          backgroundColor 
        } = req.body;
        
        if (!text || !outputFilename) {
          return res.status(400).json({ error: 'Text and output filename are required' });
        }
        
        const textImagePath = await this.effectsProcessor.createTextImage(
          text,
          outputFilename,
          { fontSize, color, backgroundColor }
        );
        
        res.json({ 
          success: true, 
          path: textImagePath,
          url: `/processed/${outputFilename}`
        });
      } catch (error) {
        console.error('Error creating text image:', error);
        res.status(500).json({ error: 'Failed to create text image' });
      }
    });
    
    // Fallback route
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  /**
   * Setup Socket.IO handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Send list of available images
      this.sendImageList(socket);
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
      
      // Handle refresh request
      socket.on('refresh-images', () => {
        this.sendImageList(socket);
      });
    });
  }

  /**
   * Send list of available images to client
   * @param {SocketIO.Socket} socket - Socket connection
   */
  sendImageList(socket) {
    try {
      const screenshots = fs.readdirSync(this.screenshotsDir)
        .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
        .map(file => ({
          name: file,
          url: `/screenshots/${file}`,
          type: 'screenshot'
        }));
      
      const processed = fs.readdirSync(this.processedDir)
        .filter(file => /\.(png|jpg|jpeg)$/i.test(file))
        .map(file => ({
          name: file,
          url: `/processed/${file}`,
          type: 'processed'
        }));
      
      socket.emit('image-list', { screenshots, processed });
    } catch (error) {
      console.error('Error sending image list:', error);
    }
  }

  /**
   * Start the server
   * @returns {Promise<void>}
   */
  start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`LED Board server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }
}

module.exports = LedBoardServer;