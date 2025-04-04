import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { formatDate, formatDateNoTime } from '../../scripts/util.js';

export default async function decorate(block) {
  // Helper function to optimize images
  function optimizeImages(container) {
    container.querySelectorAll('picture > img:not([data-optimized])').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
      optimizedPic.querySelector('img').dataset.optimized = 'true';
    });
  }

  // Helper function to create a gallery card
  function createGalleryCard(gallery) {
    const li = document.createElement('li');

    // Create image container
    if (gallery.image) {
      const imageDiv = document.createElement('div');
      imageDiv.className = 'cards-card-image';

      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.src = gallery.image;
      img.alt = gallery.title || 'Gallery';
      img.loading = 'lazy';

      picture.appendChild(img);

      // Add link if path exists
      if (gallery.path) {
        const wrapper = document.createElement('a');
        wrapper.href = gallery.path;
        wrapper.appendChild(picture);
        imageDiv.appendChild(wrapper);
      } else {
        imageDiv.appendChild(picture);
      }

      // Create overlay container for text that will appear on the image
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'cards-overlay';

      // Create body for title inside the overlay
      if (gallery.title) {
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'cards-card-body overlay-text';

        const titleH3 = document.createElement('h3');

        // Add title with link if path exists
        if (gallery.path) {
          const titleLink = document.createElement('a');
          titleLink.href = gallery.path;
          titleLink.textContent = gallery.title;
          titleH3.appendChild(titleLink);
        } else {
          titleH3.textContent = gallery.title;
        }

        bodyDiv.appendChild(titleH3);

        // Add metadata inline with the title in the overlay
        // Create metadata container for imagecount and publisheddate
        const metadataDiv = document.createElement('div');
        metadataDiv.className = 'card-metadata';

        if (metadataDiv.children.length > 0) {
          bodyDiv.appendChild(metadataDiv);
        }

        overlayDiv.appendChild(bodyDiv);
      }

      imageDiv.appendChild(overlayDiv);
      li.appendChild(imageDiv);
    }

    return li;
  }

  // Function to create roo-tales cards
  function createCards(startIndex, count, data, ul, loadMoreContainer) {
    const endIndex = Math.min(startIndex + count, data.data.length);

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i += 1) {
      const tale = data.data[i];
      const li = document.createElement('li');

      // Create image container
      if (tale.image) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'cards-card-image';

        const picture = document.createElement('picture');
        const img = document.createElement('img');
        img.src = tale.image;
        img.alt = tale.title || 'Roo Tale';
        img.loading = 'lazy';

        picture.appendChild(img);
        imageDiv.appendChild(picture);

        // Add link if path exists
        if (tale.path) {
          const wrapper = document.createElement('a');
          wrapper.href = tale.path;
          wrapper.appendChild(picture);
          imageDiv.textContent = '';
          imageDiv.appendChild(wrapper);
        }

        li.appendChild(imageDiv);
      }

      // Create body container
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'cards-card-body';

      // Add title
      if (tale.title) {
        const titleP = document.createElement('h2');
        titleP.className = 'card-title';
        if (tale.path) {
          const titleLink = document.createElement('a');
          titleLink.href = tale.path;
          titleLink.textContent = tale.title;
          titleP.appendChild(titleLink);
        } else {
          titleP.textContent = tale.title;
        }
        bodyDiv.appendChild(titleP);
      }

      // Add published date if available
      if (tale.publisheddate) {
        const dateP = document.createElement('p');
        dateP.className = 'card-publisheddate';
        dateP.textContent = formatDate(tale.publisheddate);
        bodyDiv.appendChild(dateP);
      }

      // Add description if available
      if (tale.description) {
        const descP = document.createElement('p');
        descP.className = 'card-description';
        descP.textContent = tale.description;
        bodyDiv.appendChild(descP);
      }

      if (tale.path) {
        const readMoreP = document.createElement('p');
        readMoreP.className = 'cards-card-read-more';

        const readMoreLink = document.createElement('a');
        readMoreLink.href = tale.path;
        readMoreLink.className = 'read-more';
        readMoreLink.textContent = 'Read more';

        readMoreP.appendChild(readMoreLink);
        bodyDiv.appendChild(readMoreP);
      }

      li.appendChild(bodyDiv);
      fragment.appendChild(li);
    }

    ul.appendChild(fragment);

    // Optimize newly added images
    optimizeImages(ul);

    // Update current index
    const newIndex = endIndex;

    // Hide load more button if all cards are loaded
    if (newIndex >= data.data.length) {
      loadMoreContainer.style.display = 'none';
    }

    return newIndex;
  }

  // Handle new-galleries - show latest 4 galleries
  async function createNewGalleriesCards() {
    try {
      const response = await fetch('/gallery.json');
      const galleryData = await response.json();

      if (!galleryData || !galleryData.data || !Array.isArray(galleryData.data)) {
        throw new Error('Invalid gallery data format');
      }

      // Sort by publisheddate (newest first)
      const sortedData = [...galleryData.data].sort((a, b) => {
        const dateA = a.publisheddate ? new Date(a.publisheddate).getTime() : 0;
        const dateB = b.publisheddate ? new Date(b.publisheddate).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      // Take only the first 4 entries
      const latestGalleries = sortedData.slice(0, 4);

      // Create UL element for the cards
      const ul = document.createElement('ul');
      ul.className = 'gallery-grid-two-per-row'; // Add a class for specific styling

      // Create cards for each of the latest galleries
      latestGalleries.forEach((gallery) => {
        const card = createGalleryCard(gallery);
        ul.appendChild(card);
      });

      // Optimize images
      optimizeImages(ul);

      return ul;
    } catch (error) {
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Error loading galleries.';
      const container = document.createElement('div');
      container.appendChild(errorMessage);
      return container;
    }
  }

  if (block.classList.contains('roo-tales')) {
    // Clear existing conten
    block.textContent = '';

    try {
      // Fetch data from roo-tales.json
      const response = await fetch('/roo-tales.json');
      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        const ul = document.createElement('ul');
        const cardsPerLoad = 9; // Show 9 cards initially
        let currentIndex = 0;

        // Create load more button first so it can be referenced
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'cards-load-more-container';

        const loadMoreButton = document.createElement('button');
        loadMoreButton.className = 'cards-load-more-button';
        loadMoreButton.textContent = 'Load More';
        loadMoreButton.addEventListener('click', () => {
          currentIndex = createCards(
            currentIndex,
            cardsPerLoad,
            data,
            ul,
            loadMoreContainer,
          );
        });

        loadMoreContainer.appendChild(loadMoreButton);

        // Initial load of first 9 cards
        currentIndex = createCards(0, cardsPerLoad, data, ul, loadMoreContainer);

        // Add elements to block
        block.appendChild(ul);

        // Only show load more button if there are more cards to load
        if (currentIndex < data.data.length) {
          block.appendChild(loadMoreContainer);
        }
      }
    } catch (error) {
      block.innerHTML = '<p>Error loading content.</p>';
    }
  } else if (block.classList.contains('new-galleries')) {
    // Clear existing conten
    block.textContent = '';

    // Create and add new galleries cards
    const cardsContainer = await createNewGalleriesCards();
    block.appendChild(cardsContainer);
  } else if (block.classList.contains('teaser')) {
    // Handle teaser cards
    /* change to ul, li */
    const ul = document.createElement('ul');
    [...block.children].forEach((row) => {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1) {
          if (div.querySelector('picture')) {
            div.className = 'cards-card-image';
          } else if (div.querySelector('a')) {
            // If div contains only an anchor tag
            const link = div.querySelector('a');
            const imageDiv = li.querySelector('.cards-card-image');
            if (imageDiv) {
              // Create a new wrapper anchor
              const wrapper = document.createElement('a');
              wrapper.href = link.href;
              // Wrap the picture element with the anchor
              const picture = imageDiv.querySelector('picture');
              if (picture) {
                imageDiv.removeChild(picture);
                wrapper.appendChild(picture);
                imageDiv.appendChild(wrapper);
              }
            }
            // Remove the div containing only the anchor
            div.remove();
          } else {
            div.className = 'cards-card-body';
          }
        } else {
          div.className = 'cards-card-body';
        }
      });
      ul.append(li);
    });
    ul.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });

    // Fetch gallery data and enhance teaser cards
    fetch('/gallery.json')
      .then((response) => response.json())
      .then((galleryData) => {
        if (galleryData && galleryData.data && Array.isArray(galleryData.data)) {
          // Process each card to find matches and add data
          ul.querySelectorAll('li').forEach((card) => {
            const cardBody = card.querySelector('.cards-card-body');
            if (!cardBody) return;

            // Find the link in the card to get the path
            const cardLink = card.querySelector('a');
            if (!cardLink) return;

            // Get the relative path by creating a URL object and extracting the pathname
            const href = cardLink.getAttribute('href');
            if (!href) return;

            // Extract just the pathname as the relative path
            const cardPath = href.startsWith('http')
              ? new URL(href).pathname
              : href;

            // Look for matching gallery item in the fetched data
            const matchingGallery = galleryData.data.find((item) => item.path === cardPath
              || (item.path.startsWith('/') && item.path.substring(1) === cardPath)
              || (cardPath.startsWith('/') && cardPath.substring(1) === item.path));
            if (!matchingGallery) return;

            const metadataBody = document.createElement('div');
            metadataBody.className = 'cards-card-body';

            // Add published date if available
            if (matchingGallery.publisheddate) {
              const dateP = document.createElement('p');
              dateP.className = 'card-publisheddate';
              dateP.textContent = 'POSTED ON' + formatDateNoTime(matchingGallery.publisheddate);
              metadataBody.appendChild(dateP);
            }

            // Add imagecount if available
            if (matchingGallery.imagecount) {
              const imageCountP = document.createElement('p');
              imageCountP.className = 'card-image-count';
              imageCountP.textContent = `${matchingGallery.imagecount}`;
              metadataBody.appendChild(imageCountP);
            }

            // Create a new card body for metadata instead of adding to the existing one
            if (metadataBody.children.length > 0) {
              card.insertBefore(metadataBody, cardBody);
            }
          });
        }
      });

    block.textContent = '';
    block.append(ul);
  } else {
    /* change to ul, li */
    const ul = document.createElement('ul');
    [...block.children].forEach((row) => {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      while (row.firstElementChild) li.append(row.firstElementChild);
      [...li.children].forEach((div) => {
        if (div.children.length === 1) {
          if (div.querySelector('picture')) {
            div.className = 'cards-card-image';
          } else if (div.querySelector('a')) {
            // If div contains only an anchor tag
            const link = div.querySelector('a');
            const imageDiv = li.querySelector('.cards-card-image');
            if (imageDiv) {
              // Create a new wrapper anchor
              const wrapper = document.createElement('a');
              wrapper.href = link.href;
              // Wrap the picture element with the anchor
              const picture = imageDiv.querySelector('picture');
              if (picture) {
                imageDiv.removeChild(picture);
                wrapper.appendChild(picture);
                imageDiv.appendChild(wrapper);
              }
            }
            // Remove the div containing only the anchor
            div.remove();
          } else {
            div.className = 'cards-card-body';
          }
        } else {
          div.className = 'cards-card-body';
        }
      });
      ul.append(li);
    });
    ul.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });
    block.textContent = '';
    block.append(ul);
  }
}
