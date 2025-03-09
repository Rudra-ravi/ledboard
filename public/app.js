// Connect to Socket.IO server
const socket = io();

// DOM elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const screenshotForm = document.getElementById('screenshot-form');
const processForm = document.getElementById('process-form');
const textForm = document.getElementById('text-form');
const screenshotResult = document.getElementById('screenshot-result');
const processResult = document.getElementById('process-result');
const textResult = document.getElementById('text-result');
const inputFileSelect = document.getElementById('input-file');
const refreshGalleryBtn = document.getElementById('refresh-gallery');
const screenshotsGallery = document.getElementById('screenshots-gallery');
const processedGallery = document.getElementById('processed-gallery');
const brightnessInput = document.getElementById('brightness');
const contrastInput = document.getElementById('contrast');

// Tab switching
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all buttons and panes
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Add active class to clicked button and corresponding pane
    button.classList.add('active');
    const tabId = button.dataset.tab;
    document.getElementById(tabId).classList.add('active');
  });
});

// Range input value display
document.querySelectorAll('input[type="range"]').forEach(range => {
  const valueDisplay = range.nextElementSibling;
  valueDisplay.textContent = range.value;
  
  range.addEventListener('input', () => {
    valueDisplay.textContent = range.value;
  });
});

// Screenshot form submission
screenshotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(screenshotForm);
  const data = {
    url: formData.get('url'),
    filename: formData.get('filename'),
    selector: formData.get('selector') || undefined
  };
  
  // Show loading state
  screenshotResult.innerHTML = '<p class="result-message">Capturing screenshot...</p>';
  screenshotResult.classList.add('show');
  
  try {
    const response = await fetch('/api/screenshot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      screenshotResult.innerHTML = `
        <p class="result-message success">Screenshot captured successfully!</p>
        <img src="${result.url}" alt="Screenshot" class="result-image">
      `;
      
      // Refresh the input file select options
      socket.emit('refresh-images');
    } else {
      screenshotResult.innerHTML = `
        <p class="result-message error">Error: ${result.error}</p>
      `;
    }
  } catch (error) {
    screenshotResult.innerHTML = `
      <p class="result-message error">Error: ${error.message}</p>
    `;
  }
});

// Process form submission
processForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(processForm);
  const data = {
    inputFile: formData.get('inputFile'),
    outputFilename: formData.get('outputFilename'),
    brightness: parseFloat(formData.get('brightness')) || undefined,
    contrast: parseFloat(formData.get('contrast')) || undefined,
    invert: formData.get('invert') === 'on'
  };
  
  // Show loading state
  processResult.innerHTML = '<p class="result-message">Processing image...</p>';
  processResult.classList.add('show');
  
  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      processResult.innerHTML = `
        <p class="result-message success">Image processed successfully!</p>
        <img src="${result.url}?t=${Date.now()}" alt="Processed Image" class="result-image">
      `;
      
      // Refresh the gallery
      socket.emit('refresh-images');
    } else {
      processResult.innerHTML = `
        <p class="result-message error">Error: ${result.error}</p>
      `;
    }
  } catch (error) {
    processResult.innerHTML = `
      <p class="result-message error">Error: ${error.message}</p>
    `;
  }
});

// Text form submission
textForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(textForm);
  const data = {
    text: formData.get('text'),
    outputFilename: formData.get('outputFilename'),
    fontSize: parseInt(formData.get('fontSize')) || undefined,
    color: formData.get('color').replace('#', '0x') + 'FF',
    backgroundColor: formData.get('backgroundColor').replace('#', '0x') + 'FF'
  };
  
  // Show loading state
  textResult.innerHTML = '<p class="result-message">Creating text image...</p>';
  textResult.classList.add('show');
  
  try {
    const response = await fetch('/api/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      textResult.innerHTML = `
        <p class="result-message success">Text image created successfully!</p>
        <img src="${result.url}?t=${Date.now()}" alt="Text Image" class="result-image">
      `;
      
      // Refresh the gallery
      socket.emit('refresh-images');
    } else {
      textResult.innerHTML = `
        <p class="result-message error">Error: ${result.error}</p>
      `;
    }
  } catch (error) {
    textResult.innerHTML = `
      <p class="result-message error">Error: ${error.message}</p>
    `;
  }
});

// Refresh gallery button
refreshGalleryBtn.addEventListener('click', () => {
  socket.emit('refresh-images');
});

// Socket.IO event handlers
socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('refresh-images');
});

socket.on('image-list', (data) => {
  // Update input file select options
  inputFileSelect.innerHTML = '<option value="">Select an image</option>';
  
  data.screenshots.forEach(screenshot => {
    const option = document.createElement('option');
    option.value = screenshot.name;
    option.textContent = screenshot.name;
    inputFileSelect.appendChild(option);
  });
  
  // Update screenshots gallery
  if (data.screenshots.length > 0) {
    screenshotsGallery.innerHTML = '';
    
    data.screenshots.forEach(screenshot => {
      screenshotsGallery.appendChild(createGalleryItem(screenshot));
    });
  } else {
    screenshotsGallery.innerHTML = '<p class="empty-message">No screenshots available</p>';
  }
  
  // Update processed gallery
  if (data.processed.length > 0) {
    processedGallery.innerHTML = '';
    
    data.processed.forEach(processed => {
      processedGallery.appendChild(createGalleryItem(processed));
    });
  } else {
    processedGallery.innerHTML = '<p class="empty-message">No processed images available</p>';
  }
});

// Helper function to create gallery items
function createGalleryItem(image) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  
  item.innerHTML = `
    <img src="${image.url}?t=${Date.now()}" alt="${image.name}">
    <div class="gallery-item-info">
      <div class="gallery-item-name">${image.name}</div>
      <div class="gallery-item-actions">
        <button class="btn secondary view-btn" data-url="${image.url}">View</button>
        <button class="btn secondary select-btn" data-name="${image.name}" data-type="${image.type}">Select</button>
      </div>
    </div>
  `;
  
  // Add event listeners
  const viewBtn = item.querySelector('.view-btn');
  const selectBtn = item.querySelector('.select-btn');
  
  viewBtn.addEventListener('click', () => {
    window.open(image.url, '_blank');
  });
  
  selectBtn.addEventListener('click', () => {
    if (image.type === 'screenshot') {
      inputFileSelect.value = image.name;
      
      // Switch to process tab
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      document.querySelector('[data-tab="process"]').classList.add('active');
      document.getElementById('process').classList.add('active');
    }
  });
  
  return item;
}