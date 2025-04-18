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
 * @param topic - The topic to create a link for.
 * @returns {string} - The link for the topic.
 */
function getTopicLink(topic) {
  const currentUrl = window.location.href.toLowerCase();
  let topicLink = window.location.origin;
  if (currentUrl.includes('/media-releases/')) {
    topicLink += `/topic?tag=${topic}`;
  } else if (currentUrl.includes(('/roo-tales/'))) {
    topicLink += `/roo-tales-topic?tag=${topic}`;
  }
  return topicLink;
}

export default async function decorate(block) {
  const isMainPage = window.location.pathname === '/';
  const isGalleryBlock = block.classList.contains('gallery');
  const isGalleryPage = window.location.pathname.toLowerCase().includes('/gallery/');
  const isChildGalleryPage = isGalleryPage
    && window.location.pathname.split('/').filter((p) => p).length > 1;

  // Get all the main sections (divs) of the side-navigation
  const sections = block.children;
  const headingSection = sections[0];
  const topicsSection = sections[1];
  let relatedPostsSection = sections[2];
  if (!relatedPostsSection) {
    relatedPostsSection = document.createElement('div');
    block.appendChild(relatedPostsSection);
  }

  // Add class names to each section
  if (window.location.href.toLowerCase().includes('/roo-tales/')) {
    headingSection.classList.add('heading');
    headingSection.textContent = 'Follow us on twitter';
  } else if (isMainPage) {
    // if content is coming from authored page, just add the class for right styling
    headingSection.classList.add('heading');
  } else {
    headingSection.remove();
  }

  // topics module
  const topics = getPageTopics();
  if (topics.length > 0) {
    topicsSection.classList.add('topics');
    topics.forEach((topic) => {
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
      topicsSection.appendChild(topicElement);
    });
  } else if (isMainPage) {
    // if content is coming from authored page, just add the class for right styling
    topicsSection.classList.add('topics');
  } else if (isGalleryBlock) {
    topicsSection.classList.add('gallery');
    if (isChildGalleryPage) {
      topicsSection.classList.add('metadata');
      const imageCount = document.querySelector('meta[name="imagecount"]')?.getAttribute('content');
      const publishedTime = document.querySelector('meta[name="published-time"]')?.getAttribute('content');

      if (imageCount || publishedTime) {
        topicsSection.textContent = '';
        if (imageCount) {
          const countElement = document.createElement('p');
          countElement.textContent = `${imageCount} Images`;
          topicsSection.appendChild(countElement);
        }

        if (publishedTime) {
          const dateElement = document.createElement('p');
          dateElement.textContent = `Posted on ${formatDateNoTime(publishedTime)}`;
          topicsSection.appendChild(dateElement);
        }
      }
    }
  } else {
    // If no topics found, remove the topics section
    topicsSection.remove();
  }

  // related posts module
  if (isMainPage) {
    // if content is coming from authored page, just add the class for right styling
    relatedPostsSection.remove();//classList.add('related-posts');
  } else if (isGalleryBlock) {
    relatedPostsSection.remove();
  } else {
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

          // Add entry to container
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
      // Also handle potential error case
      console.error('Error fetching related posts:', error);
      if (relatedPostsSection) {
        relatedPostsSection.remove();
      }
    }
  }
}
