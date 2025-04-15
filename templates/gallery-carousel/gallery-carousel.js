/**
 * Creates all carousel elements
 * @returns {Object} Carousel element references
 */
function createCarouselElements() {
  // Create main container
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'gallery-carousel-container';
  carouselContainer.style.display = 'none';

  // Create content area
  const carouselContent = document.createElement('div');
  carouselContent.className = 'gallery-carousel-content';

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'gallery-carousel-image';

  // Create controls container with 3-column grid layout
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'gallery-carousel-controls';

  // Left section (close button)
  const leftSection = document.createElement('div');
  leftSection.className = 'controls-left';
  const closeButton = document.createElement('button');
  closeButton.className = 'gallery-carousel-close';
  closeButton.innerHTML = '×';
  leftSection.appendChild(closeButton);

  // Center section (download link)
  const centerSection = document.createElement('div');
  centerSection.className = 'controls-center';
  const downloadLink = document.createElement('a');
  downloadLink.className = 'gallery-carousel-download';
  downloadLink.textContent = 'Download Full-Size Image';
  downloadLink.target = '_blank';
  centerSection.appendChild(downloadLink);

  // Right section (navigation)
  const rightSection = document.createElement('div');
  rightSection.className = 'controls-right';
  const navContainer = document.createElement('div');
  navContainer.className = 'gallery-carousel-nav-container';
  
  // Navigation buttons
  const prevButton = document.createElement('button');
  prevButton.className = 'gallery-carousel-nav prev';
  prevButton.innerHTML = '‹';
  
  const nextButton = document.createElement('button');
  nextButton.className = 'gallery-carousel-nav next';
  nextButton.innerHTML = '›';
  
  // Assemble the components
  navContainer.appendChild(prevButton);
  navContainer.appendChild(nextButton);
  rightSection.appendChild(navContainer);

  controlsContainer.appendChild(leftSection);
  controlsContainer.appendChild(centerSection);
  controlsContainer.appendChild(rightSection);

  carouselContent.appendChild(imageContainer);
  carouselContent.appendChild(controlsContainer);
  carouselContainer.appendChild(carouselContent);

  return {
    carouselContainer,
    imageContainer,
    downloadLink,
    prevButton,
    nextButton,
    closeButton
  };
}

/**
 * Creates an HTML page to display an image with black background
 * @param {string} imageUrl - URL of the image to display
 * @returns {string} HTML content
 */
function createImageViewerHTML(imageUrl) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Image Viewer</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: black;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
          }
          img {
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        <img src="${imageUrl}" alt="Full-size image">
      </body>
    </html>
  `;
}

/**
 * Initializes the gallery carousel for a set of images
 * @param {NodeList|Array} images - Collection of image elements
 * @returns {Function} Cleanup function
 */
export function initGalleryCarousel(images) {

  // Get or create carousel container
  let carouselContainer = document.querySelector('.gallery-carousel-container');
  let elements;

  if (!carouselContainer) {
    elements = createCarouselElements();
    carouselContainer = elements.carouselContainer;
    document.body.appendChild(carouselContainer);
  } else {
    elements = {
      imageContainer: carouselContainer.querySelector('.gallery-carousel-image'),
      downloadLink: carouselContainer.querySelector('.gallery-carousel-download'),
      prevButton: carouselContainer.querySelector('.gallery-carousel-nav.prev'),
      nextButton: carouselContainer.querySelector('.gallery-carousel-nav.next'),
      closeButton: carouselContainer.querySelector('.gallery-carousel-close')
    };
  }

  let currentImageIndex = 0;
  const { imageContainer, downloadLink, prevButton, nextButton, closeButton } = elements;

  /**
   * Gets clean image URL without query parameters
   * @param {number} index - Image index in the collection
   * @returns {string} Clean URL or empty string if invalid
   */
  function getCleanImageUrl(index) {
    if (index < 0 || index >= images.length) return '';
    return images[index].src.split('?')[0];
  }

  /**
   * Opens the image in a new tab with black background
   * @param {string} url - Image URL
   */
  function openImageInNewTab(url) {
    if (!url) return;
    
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(createImageViewerHTML(url));
      newTab.document.close();
    }
  }

  /**
   * Updates the carousel to show a specific image
   * @param {number} index - Index of the image to show
   */
  function updateCarouselImage(index) {
    const img = images[index];
    if (!img) return;

    // Create and set image
    const cleanUrl = getCleanImageUrl(index);
    const imgElement = document.createElement('img');
    imgElement.src = cleanUrl;
    imgElement.alt = img.alt || '';
    
    // Update display
    imageContainer.innerHTML = '';
    imageContainer.appendChild(imgElement);
    downloadLink.href = cleanUrl;
    currentImageIndex = index;
    
    // Show/hide navigation buttons as needed
    prevButton.style.display = index === 0 ? 'none' : 'block';
    nextButton.style.display = index === images.length - 1 ? 'none' : 'block';

    // Add zoom toggle
    imgElement.addEventListener('click', () => {
      imgElement.classList.toggle('zoomed');
    });
  }

  // Set up event handlers
  
  // Gallery image click to open carousel
  images.forEach((img, index) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', (e) => {
      e.preventDefault();
      carouselContainer.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      updateCarouselImage(index);
    });
  });

  // Download link opens image in new tab
  downloadLink.addEventListener('click', (e) => {
    e.preventDefault();
    openImageInNewTab(getCleanImageUrl(currentImageIndex));
  });

  // Close button handler
  closeButton.addEventListener('click', () => {
    carouselContainer.style.display = 'none';
    document.body.style.overflow = '';
  });

  // Previous button
  prevButton.addEventListener('click', () => {
    if (currentImageIndex > 0) {
      updateCarouselImage(currentImageIndex - 1);
    }
  });

  // Next button
  nextButton.addEventListener('click', () => {
    if (currentImageIndex < images.length - 1) {
      updateCarouselImage(currentImageIndex + 1);
    }
  });

  // Keyboard navigation
  function handleKeydown(e) {
    if (carouselContainer.style.display === 'none') return;

    switch(e.key) {
      case 'Escape':
        carouselContainer.style.display = 'none';
        document.body.style.overflow = '';
        break;
      case 'ArrowLeft':
        if (currentImageIndex > 0) {
          updateCarouselImage(currentImageIndex - 1);
        }
        break;
      case 'ArrowRight':
        if (currentImageIndex < images.length - 1) {
          updateCarouselImage(currentImageIndex + 1);
        }
        break;
    }
  }

  document.addEventListener('keydown', handleKeydown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeydown);
    images.forEach(img => {
      img.style.cursor = '';
      img.replaceWith(img.cloneNode(true));
    });
  };
}

/**
 * Initializes the gallery carousel for cards with both 'cards' and 'banner' classes
 * @param {HTMLElement} block - The block element containing the cards
 */
export function initGalleryCarouselForCards(block) {
  // Create a MutationObserver to watch for changes in the block
  const observer = new MutationObserver((mutations, obs) => {
    const galleryImages = block.querySelectorAll('.cards-card-image img');
    if (galleryImages.length > 0) {
      // Remove any existing links around the images
      galleryImages.forEach(img => {
        const wrapper = img.closest('a');
        if (wrapper) {
          wrapper.replaceWith(img);
        }
      });
      // Initialize gallery carousel
      initGalleryCarousel(Array.from(galleryImages));
      // Disconnect the observer once we've found and processed the images
      obs.disconnect();
    }
  });

  // Start observing the block for changes
  observer.observe(block, {
    childList: true,
    subtree: true
  });
}

export default async function decorate(block) {
  const bannerBlock = block.querySelector('.cards.banner');
  if (bannerBlock) {
    initGalleryCarouselForCards(bannerBlock);
  }
}

 
