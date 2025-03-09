// @ts-check
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Enhanced screenshot utility for the LED board project
 * Captures screenshots of websites with various options
 */
class ScreenshotCapture {
  /**
   * Create a new ScreenshotCapture instance
   * @param {Object} options - Configuration options
   * @param {string} options.outputDir - Directory to save screenshots
   * @param {boolean} options.headless - Run browser in headless mode
   * @param {number} options.width - Viewport width
   * @param {number} options.height - Viewport height
   */
  constructor(options = {}) {
    this.outputDir = options.outputDir || './screenshots';
    this.headless = options.headless !== false;
    this.width = options.width || 1280;
    this.height = options.height || 720;
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Capture screenshots of multiple websites
   * @param {Array<{url: string, filename: string, selector?: string}>} sites - Sites to capture
   * @returns {Promise<Array<string>>} - Paths to captured screenshots
   */
  async captureMultiple(sites) {
    // Launch a browser
    const browser = await chromium.launch({ headless: this.headless });
    
    // Create a new browser context with viewport settings
    const context = await browser.newContext({
      viewport: { width: this.width, height: this.height }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    console.log('Starting to capture screenshots...');
    
    const capturedFiles = [];
    
    try {
      for (const site of sites) {
        console.log(`Navigating to ${site.url}`);
        await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30000 });
        
        const outputPath = path.join(this.outputDir, site.filename);
        console.log(`Taking screenshot: ${outputPath}`);
        
        if (site.selector) {
          // Capture specific element if selector is provided
          const element = await page.$(site.selector);
          if (element) {
            await element.screenshot({ path: outputPath });
          } else {
            console.warn(`Element with selector "${site.selector}" not found on ${site.url}`);
            continue;
          }
        } else {
          // Capture full page
          await page.screenshot({ 
            path: outputPath, 
            fullPage: true 
          });
        }
        
        capturedFiles.push(outputPath);
      }
    } catch (error) {
      console.error('Error during screenshot capture:', error);
    } finally {
      // Close browser
      await browser.close();
    }
    
    console.log('All screenshots captured successfully!');
    return capturedFiles;
  }

  /**
   * Capture a single website screenshot
   * @param {string} url - URL to capture
   * @param {string} filename - Output filename
   * @param {string} [selector] - Optional CSS selector to capture specific element
   * @returns {Promise<string>} - Path to captured screenshot
   */
  async captureSingle(url, filename, selector) {
    return this.captureMultiple([{ url, filename, selector }]).then(files => files[0]);
  }
}

module.exports = ScreenshotCapture;