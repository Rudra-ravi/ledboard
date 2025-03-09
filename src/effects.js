// @ts-check
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

/**
 * Image effects processor for LED board
 * Applies various effects to images for display on LED boards
 */
class EffectsProcessor {
  /**
   * Create a new EffectsProcessor instance
   * @param {Object} options - Configuration options
   * @param {string} options.outputDir - Directory to save processed images
   * @param {number} options.ledSize - Size of each LED pixel
   */
  constructor(options = {}) {
    this.outputDir = options.outputDir || './processed';
    this.ledSize = options.ledSize || 10;
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Apply LED board effect to an image
   * @param {string} inputPath - Path to input image
   * @param {string} outputFilename - Output filename
   * @param {Object} options - Effect options
   * @param {number} options.brightness - Brightness adjustment (0-1)
   * @param {number} options.contrast - Contrast adjustment (0-1)
   * @param {boolean} options.invert - Invert colors
   * @returns {Promise<string>} - Path to processed image
   */
  async applyLedEffect(inputPath, outputFilename, options = {}) {
    try {
      // Load the image
      const image = await Jimp.read(inputPath);
      
      // Apply basic adjustments
      if (options.brightness !== undefined) {
        image.brightness(options.brightness);
      }
      
      if (options.contrast !== undefined) {
        image.contrast(options.contrast);
      }
      
      if (options.invert) {
        image.invert();
      }
      
      // Resize to fit LED board dimensions
      const width = Math.floor(image.getWidth() / this.ledSize);
      const height = Math.floor(image.getHeight() / this.ledSize);
      
      // Pixelate to simulate LED board
      image.resize(width, height);
      
      // Create LED effect by scaling back up with nearest neighbor
      image.resize(width * this.ledSize, height * this.ledSize, Jimp.RESIZE_NEAREST_NEIGHBOR);
      
      // Add LED grid effect
      this.#addLedGrid(image);
      
      // Save the processed image
      const outputPath = path.join(this.outputDir, outputFilename);
      await image.writeAsync(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  /**
   * Add LED grid effect to the image
   * @param {Jimp} image - Jimp image instance
   * @private
   */
  #addLedGrid(image) {
    const width = image.getWidth();
    const height = image.getHeight();
    
    // Add horizontal grid lines
    for (let y = 0; y < height; y += this.ledSize) {
      for (let x = 0; x < width; x++) {
        image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 100), x, y);
      }
    }
    
    // Add vertical grid lines
    for (let x = 0; x < width; x += this.ledSize) {
      for (let y = 0; y < height; y++) {
        image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 100), x, y);
      }
    }
  }

  /**
   * Create a scrolling text image for LED display
   * @param {string} text - Text to display
   * @param {string} outputFilename - Output filename
   * @param {Object} options - Text options
   * @param {number} options.fontSize - Font size
   * @param {string} options.color - Text color (hex)
   * @param {string} options.backgroundColor - Background color (hex)
   * @returns {Promise<string>} - Path to generated image
   */
  async createTextImage(text, outputFilename, options = {}) {
    try {
      const fontSize = options.fontSize || 32;
      const color = options.color || 0xFFFFFFFF; // White
      const backgroundColor = options.backgroundColor || 0x000000FF; // Black
      
      // Create a new image with appropriate dimensions
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      const textWidth = Jimp.measureText(font, text);
      const textHeight = Jimp.measureTextHeight(font, text, textWidth);
      
      // Create image with some padding
      const image = new Jimp(textWidth + 40, textHeight + 20, backgroundColor);
      
      // Add text
      image.print(font, 20, 10, text);
      
      // Apply LED effect
      const outputPath = path.join(this.outputDir, outputFilename);
      await image.writeAsync(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error creating text image:', error);
      throw error;
    }
  }
}

module.exports = EffectsProcessor;