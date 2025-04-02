import { formatDate } from '../../scripts/util.js';

export default async function decorate(block) {
  // Get all the main sections (divs) of the side-navigation
  const sections = block.children;

  // Add class names to each section
  if (sections.length >= 1) {
    sections[0].classList.add('heading');
  }

  if (sections.length >= 2) {
    if (block.classList.contains('main')) {
      sections[1].classList.add('topics');
    } else {
      sections[1].classList.add('posts');

      // Determine which JSON file to fetch based on URL
      let jsonEndpoint = '/media-releases.json'; // Default
      const currentUrl = window.location.href.toLowerCase();

      if (currentUrl.includes('qantas-responds')) {
        jsonEndpoint = '/qantas-responds.json';
      } else if (currentUrl.includes('speeches')) {
        jsonEndpoint = '/speeches.json';
      } else if (currentUrl.includes('roo-tales')) {
        jsonEndpoint = '/roo-tales.json';
      }
      // Fetch top 3 entries from query index
      try {
        const response = await fetch(jsonEndpoint);
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
        sections[1].innerHTML = '';
        sections[1].appendChild(entriesContainer);
      } catch (error) {
        console.error(`Error fetching data from ${jsonEndpoint}:`, error);
      }
    }
  }

  if (sections.length >= 3) {
    sections[2].classList.add('latest');
  }
}
