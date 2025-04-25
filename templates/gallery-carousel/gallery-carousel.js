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
    closeButton,
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
      closeButton: carouselContainer.querySelector('.gallery-carousel-close'),
    };
  }

  let currentImageIndex = 0;
  const {
    imageContainer, downloadLink, prevButton, nextButton, closeButton,
  } = elements;

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

    switch (e.key) {
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
      default:
        // Handle any other key press
        break;
    }
  }

  document.addEventListener('keydown', handleKeydown);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeydown);
    images.forEach((img) => {
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
      galleryImages.forEach((img) => {
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
    subtree: true,
  });
}

/**
 * Creates all video carousel elements
 * @returns {Object} Carousel element references
 */
function createVideoCarouselElements() {
  // Create main container
  const carouselContainer = document.createElement('div');
  carouselContainer.className = 'gallery-carousel-container video-carousel-container';
  carouselContainer.style.display = 'none';

  // Add skip to video embed link
  const skipLink = document.createElement('a');
  skipLink.className = 'skipVideo';
  skipLink.tabIndex = 0;
  skipLink.href = '#current';
  skipLink.id = 'skipVideo';
  skipLink.textContent = 'Skip to video embed';
  carouselContainer.appendChild(skipLink);

  // Create content area
  const carouselContent = document.createElement('div');
  carouselContent.className = 'gallery-carousel-content';

  // Create video container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'gallery-carousel-image video-carousel-player';
  videoContainer.id = 'current'; // target for skip link

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

  // Center section - empty for videos
  const centerSection = document.createElement('div');
  centerSection.className = 'controls-center';

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

  carouselContent.appendChild(videoContainer);
  carouselContent.appendChild(controlsContainer);
  carouselContainer.appendChild(carouselContent);

  return {
    carouselContainer,
    videoContainer,
    prevButton,
    nextButton,
    closeButton,
    skipLink,
  };
}

/**
 * Initializes the video carousel for a set of video cards
 * @param {NodeList|Array} videoCards - Collection of video card elements
 * @returns {Function} Cleanup function
 */
export function initVideoCarousel(videoCards) {
  if (!videoCards || videoCards.length === 0) return () => {};

  // Extract video URLs from cards
  const videos = [];
  videoCards.forEach((card) => {
    // Check if the card is a div with both cards-card-video and cards-card-image classes
    const link = card.tagName === 'A' ? card : card.querySelector('a');
    if (link && link.href) {
      videos.push({
        url: link.href,
        title: link.getAttribute('title') || '',
      });
    }
  });

  if (videos.length === 0) return () => {};

  // Get or create carousel container
  let carouselContainer = document.querySelector('.video-carousel-container');
  let elements;

  if (!carouselContainer) {
    elements = createVideoCarouselElements();
    carouselContainer = elements.carouselContainer;
    document.body.appendChild(carouselContainer);
  } else {
    elements = {
      videoContainer: carouselContainer.querySelector('.video-carousel-player'),
      prevButton: carouselContainer.querySelector('.gallery-carousel-nav.prev'),
      nextButton: carouselContainer.querySelector('.gallery-carousel-nav.next'),
      closeButton: carouselContainer.querySelector('.gallery-carousel-close'),
      skipLink: carouselContainer.querySelector('.skipVideo'),
    };
  }

  let currentVideoIndex = 0;
  const {
    videoContainer, prevButton, nextButton, closeButton, skipLink,
  } = elements;

  /**
   * Updates the carousel to show a specific video
   * @param {number} index - Index of the video to show
   */
  function updateCarouselVideo(index) {
    const video = videos[index];
    if (!video) return;

    // Clear the container
    videoContainer.innerHTML = '';

    // Create the HTML element to pass to the embed block's decorate method
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(`
      <div class="embed block" data-block-name="embed" data-block-status="loading">
        <div>
          <div><p><a href="${video.url}" title="${video.url}">${video.url}</a></p></div>
        </div>
      </div>
    `, 'text/html');

    // Get the embed block element from the parsed HTML
    const embedBlock = htmlDoc.body.firstChild;

    // Add to DOM first
    videoContainer.appendChild(embedBlock);

    // Import both JS and CSS for embed block
    Promise.all([
      import('../../blocks/embed/embed.js'),
    ]).then(([{ default: embedDecorate }]) => {
      embedDecorate(embedBlock);
    });
    currentVideoIndex = index;

    // Show/hide navigation buttons as needed
    prevButton.style.display = index === 0 ? 'none' : 'block';
    nextButton.style.display = index === videos.length - 1 ? 'none' : 'block';
  }

  // Set up event handlers for skip link
  skipLink.addEventListener('click', () => {
    // Don't prevent default to allow the #current to be added to URL
    setTimeout(() => {
      videoContainer.focus();
    }, 100);
  });

  skipLink.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // Don't prevent default for Enter key either
      setTimeout(() => {
        videoContainer.focus();
      }, 100);
    }
  });

  // Video card click to open carousel
  videoCards.forEach((card, index) => {
    // Handle clicks based on the card's structure
    if (card.classList.contains('cards-card-image') && card.classList.contains('cards-card-video')) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        carouselContainer.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        skipLink.classList.add('active');
        updateCarouselVideo(index);
      });
    }
  });

  // Close button handler
  closeButton.addEventListener('click', () => {
    carouselContainer.style.display = 'none';
    document.body.style.overflow = '';
    videoContainer.innerHTML = ''; // Remove video to stop playback
    skipLink.classList.remove('active');
  });

  closeButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      carouselContainer.style.display = 'none';
      document.body.style.overflow = '';
      videoContainer.innerHTML = ''; // Remove video to stop playback
      skipLink.classList.remove('active');
    }
  });

  // Previous button
  prevButton.addEventListener('click', () => {
    if (currentVideoIndex > 0) {
      updateCarouselVideo(currentVideoIndex - 1);
    }
  });

  // Next button
  nextButton.addEventListener('click', () => {
    if (currentVideoIndex < videos.length - 1) {
      updateCarouselVideo(currentVideoIndex + 1);
    }
  });

  // Keyboard navigation
  function handleKeydown(e) {
    if (carouselContainer.style.display === 'none') return;

    switch (e.key) {
      case 'Escape':
        carouselContainer.style.display = 'none';
        document.body.style.overflow = '';
        videoContainer.innerHTML = ''; // Remove video to stop playback
        skipLink.classList.remove('active');
        break;
      case 'ArrowLeft':
        if (currentVideoIndex > 0) {
          updateCarouselVideo(currentVideoIndex - 1);
        }
        break;
      case 'ArrowRight':
        if (currentVideoIndex < videos.length - 1) {
          updateCarouselVideo(currentVideoIndex + 1);
        }
        break;
      default:
        break;
    }
  }

  document.addEventListener('keydown', handleKeydown);

  // Set up a new observer to detect newly added video cards
  const newCardsObserver = new MutationObserver((mutations) => {
    let newCardsFound = false;

    // Check if any new video cards have been added
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        const hasNewVideoCards = Array.from(mutation.addedNodes).some(
          (node) => node.nodeType === 1
                   && (node.classList?.contains('cards-card-video')
                    || node.querySelector?.('.cards-card-video')),
        );

        if (hasNewVideoCards) {
          newCardsFound = true;
        }
      }
    });

    // If new cards were found, reinitialize the carousel with all video cards
    if (newCardsFound) {
      // Clean up existing carousel
      document.removeEventListener('keydown', handleKeydown);
      // Initialize new carousel with all video cards
      const allVideoCards = document.querySelectorAll('.cards-card-video');
      if (allVideoCards && allVideoCards.length > 0) {
        initVideoCarousel(allVideoCards);
      }
    }
  });

  // Start observing for new cards
  newCardsObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Return cleanup function that also disconnects the observer
  return () => {
    document.removeEventListener('keydown', handleKeydown);
    newCardsObserver.disconnect();
  };
}

export default async function decorate(block) {
  const bannerBlock = block.querySelector('.cards.banner');
  if (bannerBlock) {
    initGalleryCarouselForCards(bannerBlock);
  }

  // Set up a MutationObserver to wait for video cards to be loaded
  const videoCardsObserver = new MutationObserver((mutations, observer) => {
    const videoCards = document.querySelectorAll('.cards-card-video');
    if (videoCards && videoCards.length > 0) {
      // We found video cards, initialize the carousel
      initVideoCarousel(videoCards);

      // We can disconnect this observer now that we've found cards
      // A new observer inside initVideoCarousel will handle dynamically added cards
      observer.disconnect();
    }
  });

  // Start observing for DOM changes to detect when cards are loaded
  videoCardsObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also check if cards are already present
  const existingVideoCards = document.querySelectorAll('.cards-card-video');
  if (existingVideoCards && existingVideoCards.length > 0) {
    initVideoCarousel(existingVideoCards);
    videoCardsObserver.disconnect();
  }
}
