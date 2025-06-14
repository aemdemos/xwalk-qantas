import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import {
  formatDate, formatDateNoTime, sortDataByDate, createPaginationContainer, updatePagination,
} from '../../scripts/util.js';

// Get published-time from page metadata
function getPagePublishedDate() {
  const publishedTimeMeta = document.querySelector('meta[name="published-time"]');
  return publishedTimeMeta?.content || '';
}

// Helper function to optimize images
function optimizeImages(container) {
  // Keep track of how many images have been processed
  let imageCount = 0;
  container.querySelectorAll('picture > img:not([data-optimized])').forEach((img) => {
    // Set eager loading for first 2 images, lazy loading for the rest
    const isEager = imageCount < 2;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, isEager, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
    optimizedPic.querySelector('img').dataset.optimized = 'true';
    imageCount += 1;
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
function createCards(startIndex, count, data, ul, loadMoreContainer, pagePublishedDate) {
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
    const dateSource = tale.publisheddate || tale.publishDateTime || pagePublishedDate;
    if (dateSource) {
      const dateP = document.createElement('p');
      dateP.className = 'card-publisheddate';
      dateP.textContent = formatDate(dateSource);
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
    const sortedData = sortDataByDate(galleryData.data);

    // Take only the first 4 entries
    const latestGalleries = sortedData.slice(0, 6);

    // Create UL element for the cards
    const ul = document.createElement('ul');
    ul.className = 'gallery-grid-three-per-row'; // Add a class for specific styling

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

// Transform standard div rows into ul/li structure
function transformToCardsList(block) {
  const ul = document.createElement('ul');
  // Keep track of how many images have been processed
  let imageCount = 0;

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.children.length === 1) {
        if (div.querySelector('picture')) {
          div.className = 'cards-card-image';
        } else if (div.querySelector('a')) {
          const link = div.querySelector('a');
          const imageDiv = li.querySelector('.cards-card-image');
          if (imageDiv) {
            // Create a new wrapper anchor
            const wrapper = document.createElement('a');
            wrapper.href = link.href;
            // Wrap the picture element with the anchor
            const picture = imageDiv.querySelector('picture');
            if (picture && picture.parentNode === imageDiv) {
              imageDiv.removeChild(picture);
              wrapper.appendChild(picture);
              imageDiv.appendChild(wrapper);
            } else if (picture) {
              // If picture exists but isn't a direct child of imageDiv
              wrapper.appendChild(picture.cloneNode(true));
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

  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    // Set eager loading for first 2 images, lazy loading for the rest
    const isEager = imageCount < 2;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, isEager, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
    imageCount += 1;
  });

  return ul;
}

// Handle roo-tales cards
async function handleRooTales(block, pagePublishedDate) {
  // Clear existing content
  block.textContent = '';

  try {
    // Check for tag filtering in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const tagFilter = urlParams.get('tag') || '';
    const isRooTalesTopic = window.location.pathname.includes('roo-tales-topic');

    // Fetch data from roo-tales.json
    const response = await fetch('/roo-tales.json');
    const data = await response.json();

    if (data && data.data && Array.isArray(data.data)) {
      // Sort the data by date (newest first)
      const sortedData = sortDataByDate(data.data);

      // Filter data by tag if on roo-tales-topic page with tag parameter
      let filteredData = sortedData;
      if (isRooTalesTopic && tagFilter) {
        // Add a title showing the filtered tag
        const filterTitle = document.createElement('div');
        filterTitle.className = 'filter-title';
        filterTitle.innerHTML = `<h1>- ${tagFilter}</h1>`;
        block.appendChild(filterTitle);

        const subTitle = document.querySelector('.cards-container .default-content-wrapper > p');
        if (subTitle) {
          filterTitle.appendChild(subTitle);
          document.querySelector('.cards-container .default-content-wrapper').remove();
        }

        filteredData = sortedData.filter((item) => {
          const checkTagString = (tagString) => {
            if (typeof tagString !== 'string') return false;
            const tags = tagString.split(',').map((t) => t.trim());
            return tags.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase());
          };

          // Check all possible tag locations
          return checkTagString(item.pagetopics);
        });
      }

      // Update the data object with filtered data
      const sortedDataObj = { ...data, data: filteredData };

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
          sortedDataObj,
          ul,
          loadMoreContainer,
          pagePublishedDate,
        );
      });

      loadMoreContainer.appendChild(loadMoreButton);

      // Initial load of first 9 cards
      currentIndex = createCards(
        0,
        cardsPerLoad,
        sortedDataObj,
        ul,
        loadMoreContainer,
        pagePublishedDate,
      );

      // Add elements to block
      block.appendChild(ul);

      // Only show load more button if there are more cards to load
      if (currentIndex < filteredData.length) {
        block.appendChild(loadMoreContainer);
      }
    }
  } catch (error) {
    block.innerHTML = '<p>Error loading content.</p>';
  }
}

// Handle new-galleries cards
async function handleNewGalleries(block) {
  // Clear existing content
  block.textContent = '';

  // Create and add new galleries cards
  const cardsContainer = await createNewGalleriesCards();
  block.appendChild(cardsContainer);
}

// Helper function to update page title based on video filter
function updatePageHeading(isVideoFilter) {
  // Update the main heading (h1) if it exists
  const mainHeading = document.querySelector('h1');
  if (mainHeading) {
    const headingText = mainHeading.textContent;
    if (isVideoFilter && !headingText.includes('- Videos')) {
      if (headingText.includes('- Photos')) {
        mainHeading.textContent = headingText.replace('- Photos', '- Videos');
      } else if (window.location.pathname.includes('/gallery-category/')) {
        mainHeading.textContent = `${headingText} - Videos`;
      }
    } else if (!isVideoFilter && !headingText.includes('- Photos')) {
      if (headingText.includes('- Videos')) {
        mainHeading.textContent = headingText.replace('- Videos', '- Photos');
      } else if (window.location.pathname.includes('/gallery-category/')) {
        mainHeading.textContent = `${headingText} - Photos`;
      }
    }
  }
}

// Handle teaser cards
async function handleTeaser(block, pagePublishedDate) {
  // Check if we're filtering by gallery_type
  const urlParams = new URLSearchParams(window.location.search);
  const galleryType = urlParams.get('gallery_type');
  const isVideoFilter = galleryType === 'video';

  // Update page heading based on filter type
  updatePageHeading(isVideoFilter);

  // Collect all <li> cards
  const allLis = [];
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    let hasYouTubeLink = false;

    [...li.children].forEach((div) => {
      if (div.children.length === 1) {
        if (div.querySelector('picture')) {
          div.className = 'cards-card-image';
        } else if (div.querySelector('a')) {
          const link = div.querySelector('a');
          const imageDiv = li.querySelector('.cards-card-image');
          if (imageDiv) {
            // Create a new wrapper anchor
            const wrapper = document.createElement('a');
            wrapper.href = link.href;
            // Check if it's a YouTube link
            const isYouTube = link.href.includes('youtube.com') || link.href.includes('youtu.be');
            hasYouTubeLink = isYouTube; // Store this for filtering
            // Wrap the picture element with the anchor
            const picture = imageDiv.querySelector('picture');
            if (picture && picture.parentNode === imageDiv) {
              imageDiv.removeChild(picture);
              wrapper.appendChild(picture);
              imageDiv.appendChild(wrapper);
              // Add YouTube class if needed
              if (isYouTube) {
                imageDiv.classList.add('cards-card-video');
              }
            } else if (picture) {
              // If picture exists but isn't a direct child of imageDiv
              wrapper.appendChild(picture.cloneNode(true));
              imageDiv.appendChild(wrapper);
              // Add YouTube class if needed
              if (isYouTube) {
                imageDiv.classList.add('cards-card-video');
              }
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
    // If we're filtering by video type, hide non-video cards
    if (isVideoFilter && !hasYouTubeLink) {
      li.style.display = 'none';
      li.dataset.filteredOut = 'true';
    } else if (!isVideoFilter && hasYouTubeLink) {
      li.style.display = 'none';
      li.dataset.filteredOut = 'true';
    } else {
      li.dataset.filteredOut = 'false';
    }
    allLis.push(li);
  });

  // Keep track of how many images have been processed
  let imageCount = 0;

  // Optimize images
  allLis.forEach((li) => {
    const imageDiv = li.querySelector('.cards-card-image');
    if (imageDiv) {
      const picture = imageDiv.querySelector('picture');
      if (picture) {
        // Set eager loading for first 2 images, lazy loading for the rest
        const isEager = imageCount < 2;
        const optimizedPic = createOptimizedPicture(picture.querySelector('img').src, picture.querySelector('img').alt, isEager, [{ width: '750' }]);
        moveInstrumentation(picture.querySelector('img'), optimizedPic.querySelector('img'));
        picture.parentNode.replaceChild(optimizedPic, picture);
        imageCount += 1;
      }
    }
  });

  // Fetch gallery data and enhance teaser cards
  try {
    const response = await fetch('/gallery.json');
    const galleryData = await response.json();

    if (galleryData && galleryData.data && Array.isArray(galleryData.data)) {
      // Process each card to find matches and add data
      allLis.forEach((card) => {
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
        const matchingPath = (item) => item.path === cardPath
          || (item.path.startsWith('/') && item.path.substring(1) === cardPath)
          || (cardPath.startsWith('/') && cardPath.substring(1) === item.path);

        const matchingGallery = galleryData.data.find(matchingPath);
        const metadataBody = document.createElement('div');
        metadataBody.className = 'cards-card-body';

        if (matchingGallery) {
          // Add published date if available
          const galleryDateSource = matchingGallery.publisheddate
            || matchingGallery.publishDateTime
            || pagePublishedDate;
          if (galleryDateSource) {
            const dateP = document.createElement('p');
            dateP.className = 'card-publisheddate';
            dateP.textContent = `POSTED ON ${formatDateNoTime(galleryDateSource)}`;
            metadataBody.appendChild(dateP);
          }

          // Add imagecount if available
          if (matchingGallery.imagecount) {
            const imageCountP = document.createElement('p');
            imageCountP.className = 'card-image-count';
            imageCountP.textContent = `${matchingGallery.imagecount}`;
            metadataBody.appendChild(imageCountP);
          }
        } else {
          // Create default structure when no matching gallery is found
          // Use page published date if available
          const dateP = document.createElement('p');
          dateP.className = 'card-publisheddate';
          dateP.textContent = `POSTED ON ${formatDateNoTime(pagePublishedDate)}`;
          metadataBody.appendChild(dateP);
        }
        // Create a new card body for metadata instead of adding to the existing one
        if (metadataBody.children.length > 0) {
          card.insertBefore(metadataBody, cardBody);
        }
      });
    }
  } catch (error) {
    // Silent error handling - gallery data enhancement will be skipped
    // No console statements to avoid linter errors
  }

  // Pagination logic - filter out hidden items for accurate pagination
  const cardsPerPage = 9;
  let currentPage = parseInt(new URLSearchParams(window.location.search).get('page'), 10) || 1;
  const ul = document.createElement('ul');
  allLis.forEach((li) => ul.appendChild(li));
  const paginationContainer = createPaginationContainer();

  // Get only visible (non-filtered) items for pagination
  const getVisibleItems = () => allLis.filter((li) => {
    // Check if item was filtered out by video/photo logic
    const wasFilteredOut = li.dataset.filteredOut === 'true';
    return !wasFilteredOut;
  });

  function renderPage(page) {
    const visibleItems = getVisibleItems();

    // Hide all items first
    allLis.forEach((li) => {
      li.style.display = 'none';
    });

    // Show only items for current page that aren't filtered out
    const startIdx = (page - 1) * cardsPerPage;
    const endIdx = startIdx + cardsPerPage;
    visibleItems.slice(startIdx, endIdx).forEach((li) => {
      li.style.display = '';
    });
  }

  function handlePageChange(newPage) {
    const url = new URL(window.location);
    url.searchParams.set('page', newPage);
    window.history.pushState({}, '', url);
    currentPage = newPage;
    renderPage(currentPage);
    const visibleCount = getVisibleItems().length;
    updatePagination(visibleCount, cardsPerPage, currentPage, handlePageChange);

    // Maintain title when navigating pages
    // eslint-disable-next-line no-shadow
    const urlParams = new URLSearchParams(url.search);
    // eslint-disable-next-line no-shadow
    const galleryType = urlParams.get('gallery_type');
    updatePageHeading(galleryType === 'video');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Check if there are any visible items after filtering
  const visibleCount = getVisibleItems().length;

  block.textContent = '';

  if (visibleCount === 0) {
    // Show "No results" message when no items match the filter
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results-message';
    noResultsDiv.innerHTML = 'No results';
    block.appendChild(noResultsDiv);
  } else {
    // Show normal results with pagination
    block.appendChild(ul);
    block.appendChild(paginationContainer);

    // Ensure current page doesn't exceed available pages
    const totalPages = Math.ceil(visibleCount / cardsPerPage);
    if (currentPage > totalPages) {
      currentPage = 1;
    }

    renderPage(currentPage);
    updatePagination(visibleCount, cardsPerPage, currentPage, handlePageChange);
  }
}

// Handle default cards
function handleDefaultCards(block) {
  const ul = transformToCardsList(block);
  block.textContent = '';
  block.append(ul);
}

export default async function decorate(block) {
  // Store the page's published date for fallback
  const pagePublishedDate = getPagePublishedDate();

  // Determine the card type and handle accordingly
  if (block.classList.contains('roo-tales')) {
    await handleRooTales(block, pagePublishedDate);
  } else if (block.classList.contains('new-galleries')) {
    await handleNewGalleries(block);
  } else if (block.classList.contains('teaser')) {
    await handleTeaser(block, pagePublishedDate);
  } else {
    handleDefaultCards(block);
  }
}
