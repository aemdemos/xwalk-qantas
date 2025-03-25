export default async function decorate(block) {
  function parsePublishedDate(dateString) {
    if (!dateString) return null;
    const regex = /Published on \d+(?:st|nd|rd|th) (\w+) (\d{4})/;
    const match = dateString.match(regex);
    if (match) {
      const month = match[1]; // January
      const year = match[2]; // 2025
      return { month, year };
    }
    return null;
  }

  // Create a container for months at the end
  const monthsSection = document.createElement('div');
  monthsSection.className = 'months-section';

  function moveMonthsToSection(item) {
    const monthsBody = item.querySelector('.archive-item-body');
    monthsSection.innerHTML = '';
    const clonedBody = monthsBody.cloneNode(true);
    clonedBody.style.display = 'block';
    monthsSection.appendChild(clonedBody);
  }

  // Create a wrapper div for all archive items
  const archiveItemsWrapper = document.createElement('div');
  archiveItemsWrapper.className = 'archive-items-wrapper';

  const endpoint = '/media-releases.json';
  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    // Group items by year and month
    const groupedByYear = new Map();

    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach((item) => {
        const dateInfo = parsePublishedDate(item.publisheddate);
        if (dateInfo) {
          const { year, month } = dateInfo;

          // Initialize year if not exists
          if (!groupedByYear.has(year)) {
            groupedByYear.set(year, new Map());
          }

          // Initialize month array if not exists
          const yearMap = groupedByYear.get(year);
          if (!yearMap.has(month)) {
            yearMap.set(month, []);
          }

          // Add item to appropriate month array
          yearMap.get(month).push(item);
        }
      });
    }

    // Create archive items from grouped data
    const archiveItemsWrapper = document.createElement('div');
    archiveItemsWrapper.className = 'archive-items-wrapper';
    const archiveItems = []; // Add this array to store the details elements

    // Sort years in descending order
    const sortedYears = Array.from(groupedByYear.keys()).sort((a, b) => b - a);

    sortedYears.forEach((year, index) => {
      const details = document.createElement('details');
      details.className = 'archive-item';
      if (index === 0) details.setAttribute('open', '');

      const summary = document.createElement('summary');
      summary.className = 'archive-item-label';
      const yearP = document.createElement('p');
      yearP.textContent = year;
      summary.appendChild(yearP);

      const body = document.createElement('div');
      body.className = 'archive-item-body';

      // Get months for this year and sort them
      const monthsMap = groupedByYear.get(year);
      const months = Array.from(monthsMap.keys());
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));

      months.forEach((month) => {
        const buttonContainer = document.createElement('p');
        buttonContainer.className = 'button-container';

        const link = document.createElement('a');
        const monthNum = (monthOrder.indexOf(month) + 1).toString().padStart(2, '0');
        link.href = `https://www.qantasnewsroom.com.au/search/${year}/${monthNum}/`;
        link.title = `${month} ${year}`;
        link.className = 'button';
        link.textContent = `${month} ${year}`;

        buttonContainer.appendChild(link);
        body.appendChild(buttonContainer);
      });

      details.appendChild(summary);
      details.appendChild(body);
      archiveItemsWrapper.appendChild(details);
      archiveItems.push(details); // Add this line to store the details element
    });

    // Store the last div's content before clearing
    const lastDiv = block.children[block.children.length - 1];
    const lastDivContent = lastDiv?.querySelector('p')?.innerHTML || 'For previous years\' press releases, <a href="http://www.qantas.com.au/travel/airlines/media-room/global/en">click here</a>.';

    // Clear existing content and add new structure
    block.innerHTML = '';
    block.appendChild(archiveItemsWrapper);

    // Add the months section to the end of the block
    block.appendChild(monthsSection);

    // Create and add the prev-archives div using the saved content
    const prevArchivesDiv = document.createElement('div');
    prevArchivesDiv.className = 'prev-archives';
    const paragraph = document.createElement('p');
    paragraph.innerHTML = lastDivContent;
    prevArchivesDiv.appendChild(paragraph);
    block.appendChild(prevArchivesDiv);

    // Set up event handlers and initialization
    setTimeout(() => {
      // Make first item the default item
      const defaultItem = archiveItems.length > 0 ? archiveItems[0] : null;

      archiveItems.forEach((item) => {
        // Add click event handler
        const summary = item.querySelector('summary');
        summary.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default details toggle

          // Close all other items
          archiveItems.forEach((otherItem) => {
            if (otherItem !== item) {
              otherItem.removeAttribute('open');
            }
          });

          // Toggle open state
          const wasOpen = item.hasAttribute('open');
          if (!wasOpen) {
            item.setAttribute('open', '');
            moveMonthsToSection(item);
          }
        });
      });

      // Open default item (first item)
      if (defaultItem) {
        defaultItem.setAttribute('open', '');
        moveMonthsToSection(defaultItem);
      }
    }, 50);
  } catch (error) {
    console.error('Error loading archives:', error);
    block.innerHTML = '<p>An error occurred while loading the archives.</p>';
  }
}
