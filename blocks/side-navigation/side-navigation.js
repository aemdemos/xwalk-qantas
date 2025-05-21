import { formatDate, formatDateNoTime } from '../../scripts/util.js';

/**
 * Get the page topics from the meta tag.
 * @returns {string[]|*[]} - The topics from the meta tag.
 */
function getPageTopics() {
  const topics = document.querySelector('meta[name="pagetopics"]')?.getAttribute('content');
  return topics ? topics.split(',').map((topic) => topic.trim()) : [];
}

/**
 * Get the JSON endpoint based on the current URL.
 * @returns {string} - The JSON endpoint to fetch.
 */
function getQueryIndexJsonEndpoint() {
  // Determine which JSON file to fetch based on URL
  let jsonEndpoint = '/media-releases.json'; // Default
  const currentUrl = window.location.href.toLowerCase();

  if (currentUrl.includes('qantas-responds') || currentUrl.includes('featured')) {
    jsonEndpoint = '/qantas-responds.json';
  } else if (currentUrl.includes('speeches')) {
    jsonEndpoint = '/speeches.json';
  } else if (currentUrl.includes('roo-tales')) {
    jsonEndpoint = '/roo-tales.json';
  }
  return jsonEndpoint;
}

/**
 * Get the link for a topic based on the current URL.
 * @param {string} topic - The topic to create a link for.
 * @returns {string} - The link for the topic.
 */
function getTopicLink(topic) {
  const currentUrl = window.location.href.toLowerCase();
  let topicLink = window.location.origin;
  if (currentUrl.includes('/media-releases/') || currentUrl.includes('/speeches/')
    || currentUrl.includes('/qantas-responds/') || currentUrl.includes('/featured/')) {
    topicLink += `/topic?tag=${topic}`;
  } else if (currentUrl.includes(('/roo-tales/'))) {
    topicLink += `/roo-tales-topic?tag=${topic}`;
  }
  return topicLink;
}

/**
 * Setup page context and information
 * @returns {Object} Object with page context information
 */
function setupPageContext() {
  return {
    isMainPage: window.location.pathname === '/',
    isGalleryBlock: false, // Will be set after checking block classes
    isGalleryPage: window.location.pathname.toLowerCase().includes('/gallery/'),
    isRooTalesPage: window.location.href.toLowerCase().includes('/roo-tales/'),
    currentUrl: window.location.href.toLowerCase(),
  };
}

/**
 * Handle the heading section
 * @param {Element} headingSection - The heading section element
 * @param {Object} context - Page context information
 */
function handleHeadingSection(headingSection, context) {
  if (context.isRooTalesPage) {
    headingSection.classList.add('heading');
    headingSection.textContent = 'Follow us on twitter';
  } else if (context.isMainPage) {
    // If content is coming from authored page, just add the class for right styling
    headingSection.classList.add('heading');
  } else if (context.isMediaEnquires) {
    headingSection.remove();
    const mediaHeading = document.getElementById('media-enquiries');
    const formWrapper = document.querySelector('.form-wrapper');
    if (mediaHeading && formWrapper) {
      formWrapper.insertBefore(mediaHeading, formWrapper.firstChild);
      const defaultContentWrapper = document.querySelector('.form-container .default-content-wrapper');
      if (defaultContentWrapper && !defaultContentWrapper.textContent.trim()) {
        defaultContentWrapper.remove();
      }
    }
  } else {
    headingSection.remove();
  }
}

/**
 * Create a topic element
 * @param {string} topic - The topic name
 * @returns {Element} - The created topic element
 */
function createTopicElement(topic) {
  const topicElement = document.createElement('div');
  topicElement.className = 'topic';

  // Create topic link/entry
  const linkElement = document.createElement('a');
  linkElement.href = getTopicLink(topic);
  linkElement.className = topic;

  if (linkElement.href.endsWith(`/topic?tag=${topic}`)) {
    const iconImg = document.createElement('img');
    iconImg.src = `/icons/${topic}.svg`;
    iconImg.alt = topic;
    linkElement.appendChild(iconImg);
  }

  const titleElement = document.createElement('div');
  titleElement.textContent = topic.replace(/-/g, ' ').toUpperCase();

  linkElement.appendChild(titleElement);
  topicElement.appendChild(linkElement);

  return topicElement;
}

/**
 * Handle the gallery metadata
 * @param {Element} topicsSection - The topics section element
 */
function handleGalleryMetadata(topicsSection) {
  topicsSection.classList.add('metadata');
  const imageCount = document.querySelector('meta[name="imagecount"]')?.getAttribute('content');
  const publishedTime = document.querySelector('meta[name="published-time"]')?.getAttribute('content');

  if (imageCount || publishedTime) {
    topicsSection.textContent = '';
    if (imageCount) {
      const countElement = document.createElement('p');
      // Remove any existing 'Images' or 'Image' (case-insensitive) from the meta value
      const count = imageCount.replace(/images?/i, '').trim();
      countElement.textContent = `${count} Images`;
      topicsSection.appendChild(countElement);
    }

    if (publishedTime) {
      const dateElement = document.createElement('p');
      dateElement.textContent = `Posted on ${formatDateNoTime(publishedTime)}`;
      topicsSection.appendChild(dateElement);
    }
  }
}

/**
 * Handle the topics section
 * @param {Element} topicsSection - The topics section element
 * @param {Object} context - Page context information
 * @param {boolean} isChildGalleryPage - Whether this is a child gallery page
 */
function handleTopicsSection(topicsSection, context, isChildGalleryPage) {
  const topics = getPageTopics();

  if (topics.length > 0) {
    topicsSection.classList.add('topics');
    topics.forEach((topic) => {
      const topicElement = createTopicElement(topic);
      topicsSection.appendChild(topicElement);
    });
  } else if (context.isMainPage) {
    // If content is coming from authored page, just add the class for right styling
    topicsSection.classList.add('topics');
  } else if (context.isGalleryBlock) {
    topicsSection.classList.add('gallery');
    if (isChildGalleryPage) {
      handleGalleryMetadata(topicsSection);
    }
  } else if (context.isMediaEnquires) {
    topicsSection.classList.add('media-enquiries');
  } else {
    // If no topics found, remove the topics section
    topicsSection.remove();
  }
}

/**
 * Create an entry element for related posts
 * @param {Object} entry - The post entry data
 * @returns {Element} - The created entry element
 */
function createEntryElement(entry) {
  const entryElement = document.createElement('div');
  entryElement.className = 'entry';

  // Create title with link
  const titleElement = document.createElement('p');
  const linkElement = document.createElement('a');
  linkElement.href = entry.path;
  linkElement.textContent = entry.title;
  titleElement.appendChild(linkElement);

  // Create date element
  const dateElement = document.createElement('p');
  dateElement.className = 'date';
  const publishedLocation = entry.publishedlocation ? `${entry.publishedlocation} • ` : '';
  const formattedDate = formatDate(entry.publisheddate || entry.publishDateTime);
  dateElement.textContent = publishedLocation + formattedDate;

  // Add elements to entry
  entryElement.appendChild(titleElement);
  entryElement.appendChild(dateElement);

  return entryElement;
}

/**
 * Fetch and process related posts
 * @param {Element} relatedPostsSection - The related posts section element
 * @returns {Promise<void>}
 */
async function fetchAndProcessRelatedPosts(relatedPostsSection) {
  try {
    // Fetch top 3 entries from query index
    const response = await fetch(getQueryIndexJsonEndpoint());
    const data = await response.json();

    // Get the top 3 entries by publishDateTime
    const sortedEntries = data.data
      .filter((entry) => entry.publisheddate || entry.publishDateTime)
      .sort((a, b) => {
        const dateA = new Date(a.publisheddate || a.publishDateTime);
        const dateB = new Date(b.publisheddate || b.publishDateTime);
        return dateB - dateA;
      })
      .slice(0, 3); // Take top 3 after sorting

    if (sortedEntries.length > 0) {
      relatedPostsSection.classList.add('related-posts');

      // Create a container for the entries
      const entriesContainer = document.createElement('div');
      entriesContainer.className = 'recent-entries';

      // Add entries to the container
      sortedEntries.forEach((entry) => {
        const entryElement = createEntryElement(entry);
        entriesContainer.appendChild(entryElement);
      });

      // Clear existing content
      relatedPostsSection.innerHTML = '';

      // Add a title to the section
      const titleElement = document.createElement('div');
      titleElement.className = 'title';
      titleElement.textContent = 'Related Posts';
      relatedPostsSection.appendChild(titleElement);

      relatedPostsSection.appendChild(entriesContainer);
    } else if (relatedPostsSection) {
      // If no entries found and section exists, remove it
      relatedPostsSection.remove();
    }
  } catch (error) {
    // Handle potential error case
    if (relatedPostsSection) {
      relatedPostsSection.remove();
    }
  }
}

/**
 * Handle the related posts section
 * @param {Element} relatedPostsSection - The related posts section element
 * @param {Object} context - Page context information
 * @returns {Promise<void>}
 */
async function handleRelatedPostsSection(relatedPostsSection, context) {
  if (context.isMainPage || context.isGalleryBlock || context.isMediaEnquires) {
    relatedPostsSection.remove();
  } else {
    await fetchAndProcessRelatedPosts(relatedPostsSection);
  }
}

/**
 * Main decorator function for side-navigation block
 * @param {Element} block - The block element to decorate
 */
export default async function decorate(block) {
  // Setup context
  const context = setupPageContext();
  context.isGalleryBlock = block.classList.contains('gallery');
  context.isMediaEnquires = block.classList.contains('media-enquiries');

  const isChildGalleryPage = context.isGalleryPage
    && window.location.pathname.split('/').filter((p) => p).length > 1;

  // Get all the main sections (divs) of the side-navigation
  const sections = block.children;
  const headingSection = sections[0];
  const topicsSection = sections[1];
  let relatedPostsSection = sections[2];

  // Create related posts section if it doesn't exist
  if (!relatedPostsSection) {
    relatedPostsSection = document.createElement('div');
    block.appendChild(relatedPostsSection);
  }

  // Process each section
  handleHeadingSection(headingSection, context);
  handleTopicsSection(topicsSection, context, isChildGalleryPage);
  await handleRelatedPostsSection(relatedPostsSection, context);
}
