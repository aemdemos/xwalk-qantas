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

  // Previous button
  const prev = document.createElement('button');
  prev.textContent = 'Previous';
  prev.disabled = currentPage === 1;
  prev.onclick = () => onPageChange(currentPage - 1);
  container.appendChild(prev);

  // Page numbers (show up to 5 pages, with ellipsis if needed)
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

  if (start > 1) {
    const first = document.createElement('button');
    first.textContent = '1';
    first.onclick = () => onPageChange(1);
    container.appendChild(first);
    if (start > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      container.appendChild(dots);
    }
  }

  for (let i = start; i <= end; i += 1) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.onclick = () => onPageChange(i);
    container.appendChild(btn);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      container.appendChild(dots);
    }
    const last = document.createElement('button');
    last.textContent = totalPages;
    last.onclick = () => onPageChange(totalPages);
    container.appendChild(last);
  }

  // Next button
  const next = document.createElement('button');
  next.textContent = 'Next';
  next.disabled = currentPage === totalPages;
  next.onclick = () => onPageChange(currentPage + 1);
  container.appendChild(next);
} 