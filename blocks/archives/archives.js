export default function decorate(block) {
  // Create a container for months at the end
  const monthsSection = document.createElement('div');
  monthsSection.className = 'months-section';

  // Create a wrapper div for all archive items
  const archiveItemsWrapper = document.createElement('div');
  archiveItemsWrapper.className = 'archive-items-wrapper';

  // Process the archive items
  const archiveItems = [];

  // Get all rows and separate the last one
  const rows = [...block.children];
  const lastRow = rows.pop(); // Remove the last row from processing

  // Process all rows except the last one
  rows.forEach((row) => {
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'archive-item-label';
    summary.append(...label.childNodes);

    // Decorate archive item body (months)
    const body = row.children[1];
    body.className = 'archive-item-body';

    // Create the archive item
    const details = document.createElement('details');
    details.className = 'archive-item';
    details.append(summary, body);

    // Add the details to the wrapper instead of replacing rows
    archiveItemsWrapper.appendChild(details);
    archiveItems.push(details);

    // Remove the original row
    row.remove();
  });

  // Add the archive items wrapper to the block
  block.appendChild(archiveItemsWrapper);

  // Add the months section to the end of the block
  block.appendChild(monthsSection);

  // Create and add the prev-archives div using the content from the last row
  const prevArchivesDiv = document.createElement('div');
  prevArchivesDiv.className = 'prev-archives';

  // If we have a last row, use its content, otherwise create default content
  if (lastRow && lastRow.children && lastRow.children.length > 0) {
    prevArchivesDiv.append(...lastRow.children);
  } else {
    // Create default content if no last row exists
    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'For previous years\' press releases, <a href="http://www.qantas.com.au/travel/airlines/media-room/global/en">click here</a>.';
    prevArchivesDiv.appendChild(paragraph);
  }

  // Add the prev-archives div to the block
  block.appendChild(prevArchivesDiv);

  // Remove the original last row
  if (lastRow) {
    lastRow.remove();
  }

  // Function to move months to the months section
  function moveMonthsToSection(item) {
    const monthsBody = item.querySelector('.archive-item-body');

    // Clear previous content
    monthsSection.innerHTML = '';

    // Clone the months content to the section
    const clonedBody = monthsBody.cloneNode(true);
    clonedBody.style.display = 'block';
    monthsSection.appendChild(clonedBody);
  }
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
}
