/**
 * Creates and returns a pagination container element.
 * @returns {HTMLDivElement} The pagination container.
 */
export function createPaginationContainer() {
  const container = document.createElement('div');
  container.className = 'pagination';
  return container;
}

/**
 * Updates the pagination controls inside the given container.
 * @param {number} totalItems - Total number of items to paginate.
 * @param {number} itemsPerPage - Number of items per page.
 * @param {number} currentPage - The current page number (1-based).
 * @param {function} onPageChange - Callback when a page is selected.
 */
export function updatePagination(totalItems, itemsPerPage, currentPage, onPageChange) {
  const container = document.querySelector('.pagination');
  if (!container) return;

  container.innerHTML = '';
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return;

  // Page numbers (show up to 5 pages, with ellipsis if needed)
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

  if (start > 1) {
    const first = document.createElement('a');
    first.textContent = '1';
    first.href = '#';
    first.onclick = (e) => {
      e.preventDefault();
      onPageChange(1);
    };
    if (currentPage === 1) first.classList.add('current');
    container.appendChild(first);
    if (start > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      container.appendChild(dots);
    }
  }

  for (let i = start; i <= end; i += 1) {
    const link = document.createElement('a');
    link.textContent = i;
    link.href = '#';
    if (i === currentPage) link.classList.add('current');
    link.onclick = (e) => {
      e.preventDefault();
      onPageChange(i);
    };
    container.appendChild(link);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      container.appendChild(dots);
    }
    const last = document.createElement('a');
    last.textContent = totalPages;
    last.href = '#';
    last.onclick = (e) => {
      e.preventDefault();
      onPageChange(totalPages);
    };
    if (currentPage === totalPages) last.classList.add('current');
    container.appendChild(last);
  }

  // Next link only
  const next = document.createElement('a');
  next.textContent = '>';
  next.href = '#';
  next.className = 'next';
  if (currentPage === totalPages) {
    next.classList.add('disabled');
    next.onclick = (e) => e.preventDefault();
  } else {
    next.onclick = (e) => {
      e.preventDefault();
      onPageChange(currentPage + 1);
    };
  }
  container.appendChild(next);
} 