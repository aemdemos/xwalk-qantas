/**
 * Creates and returns a pagination container element.
 *
 * @returns {HTMLDivElement} The pagination container <div> with class 'pagination'.
 *
 * @example
 * const paginationContainer = createPaginationContainer();
 * block.appendChild(paginationContainer);
 */
export function createPaginationContainer() {
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  return paginationContainer;
}

/**
 * Updates the pagination container with page numbers and navigation controls.
 *
 * @param {number} totalItems - The total number of items to paginate.
 * @param {number} itemsPerPage - The number of items to show per page.
 * @param {number} pageNum - The current page number (1-based).
 * @param {function} onPageChange - Callback function to call when a page is selected. Receives the new page number as an argument.
 *
 * @example
 * updatePagination(100, 9, 1, (newPage) => {
 *   // Handle page change
 * });
 *
 * This function will clear and repopulate the pagination container ('.pagination')
 * with numbered page links and a next arrow if needed. The current page is highlighted.
 */
export function updatePagination(totalItems, itemsPerPage, pageNum, onPageChange) {
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxVisiblePages = 8;
  let startPage;
  let endPage;

  if (totalPages <= maxVisiblePages) {
    startPage = 1;
    endPage = totalPages;
  } else if (pageNum <= 4) {
    startPage = 1;
    endPage = 7;
  } else if (pageNum >= totalPages - 3) {
    startPage = totalPages - 6;
    endPage = totalPages;
  } else {
    startPage = pageNum - 3;
    endPage = pageNum + 3;
  }

  for (let i = startPage; i <= endPage; i += 1) {
    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.textContent = i.toString();
    pageLink.className = 'page-link';

    if (i === pageNum) {
      pageLink.classList.add('current');
    }

    pageLink.addEventListener('click', (e) => {
      e.preventDefault();
      onPageChange(i);
    });

    paginationContainer.appendChild(pageLink);
  }

  if (pageNum < totalPages) {
    const nextLink = document.createElement('a');
    nextLink.href = '#';
    nextLink.textContent = '>';
    nextLink.className = 'page-link next';

    nextLink.addEventListener('click', (e) => {
      e.preventDefault();
      onPageChange(pageNum + 1);
    });

    paginationContainer.appendChild(nextLink);
  }
} 