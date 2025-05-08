import { formatDate, sortDataByDate } from '../../scripts/util.js';

// Pagination related functions
function createPaginationContainer() {
  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';
  return paginationContainer;
}

function updatePagination(totalItems, itemsPerPage, pageNum, onPageChange) {
  const paginationContainer = document.querySelector('.pagination');
  if (!paginationContainer) return;

  // Clear existing pagination
  paginationContainer.innerHTML = '';

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Determine how many page numbers to show
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

  // Create numbered page links
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

  // Add next page button if not on last page
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

// Search related functions
function createSearchHeader(query, count) {
  const searchHeader = document.createElement('div');
  searchHeader.className = 'search-results-header';

  const resultsHeading = document.createElement('h2');
  resultsHeading.textContent = `Search results for "${query}"`;

  const resultsCount = document.createElement('p');
  resultsCount.textContent = `${count} results found`;

  searchHeader.appendChild(resultsHeading);
  searchHeader.appendChild(resultsCount);

  return searchHeader;
}

function createNoResultsMessage() {
  const noResults = document.createElement('div');
  noResults.className = 'no-results';
  noResults.innerHTML = `
    <h3>No results found</h3>
    <p>Your search did not match any documents. Please try different keywords or browse our sections.</p>
  `;
  return noResults;
}

function filterSearchResults(data, searchQuery, urlParams) {
  // Check for different types of search filters
  const isTopicTagUrl = window.location.href.toLowerCase().includes('topic?tag=');
  const isYearMonthFilter = urlParams.get('year') && urlParams.get('month');
  const isLocationFilter = urlParams.get('location') !== null;

  return data.filter((item) => {
    // If this is a topic?tag= URL, filter by pagetopics
    if (isTopicTagUrl) {
      const tag = searchQuery.toLowerCase();
      const itemTopics = (item.pagetopics || '').toString().toLowerCase();
      return itemTopics.split(',').map((t) => t.trim()).some((topic) => topic === tag);
    }

    // If year and month parameters are present, filter by date
    if (isYearMonthFilter) {
      const year = urlParams.get('year');
      const month = urlParams.get('month').padStart(2, '0');
      const datePrefix = `${year}-${month}`;
      const publishedDate = item.publisheddate || item.publishDateTime || '';
      return publishedDate.startsWith(datePrefix);
    }

    // If location parameter is present, only filter by location
    if (isLocationFilter) {
      const location = (item.publishedlocation || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return location.includes(query);
    }

    // Otherwise use standard search filtering
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const location = (item.publishedlocation || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query)
      || description.includes(query)
      || location.includes(query);
  });
}

// Post item related functions
function createPostItem(item) {
  const postItem = document.createElement('div');
  postItem.className = 'post-item';

  // Add the image if available
  if (item.image) {
    const postImage = document.createElement('div');
    postImage.className = 'post-image';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || 'Image';
    img.loading = 'lazy';

    postImage.appendChild(img);
    postItem.appendChild(postImage);
  }

  // Create the post text container
  const postText = document.createElement('div');
  postText.className = 'post-text';

  // Create and add the title with link
  const postTitle = document.createElement('h2');
  postTitle.className = 'post-title';

  const titleLink = document.createElement('a');
  titleLink.href = item.path || '#';
  titleLink.textContent = item.title || 'Untitled';

  postTitle.appendChild(titleLink);
  postText.appendChild(postTitle);

  // Create and add the publication date
  const postMeta = document.createElement('p');
  postMeta.className = 'post-meta';
  const publishedLocation = item.publishedlocation ? `${item.publishedlocation} • ` : '';
  const formattedDate = formatDate(item.publisheddate || item.publishDateTime);
  postMeta.textContent = `${publishedLocation}Posted on ${formattedDate}`;

  postText.appendChild(postMeta);

  // Create and add the excerpt wrapper and excerpt
  const postExcerptWrap = document.createElement('div');
  postExcerptWrap.className = 'post-excerpt-wrap';

  const postExcerpt = document.createElement('div');
  postExcerpt.className = 'post-excerpt';

  const excerptText = document.createElement('p');
  excerptText.textContent = item.description || '';

  postExcerpt.appendChild(excerptText);
  postExcerptWrap.appendChild(postExcerpt);
  postText.appendChild(postExcerptWrap);

  // Create and add the read more link
  const readMore = document.createElement('a');
  readMore.className = 'read-more';
  readMore.href = item.path || '#';
  readMore.textContent = 'Read more';

  postText.appendChild(readMore);
  postItem.appendChild(postText);

  return postItem;
}

function displayItems(items, container) {
  // Store the search header if it exists
  const searchHeader = container.querySelector('.search-results-header');

  // Clear the container
  container.innerHTML = '';

  // Add back the search header if it exists
  if (searchHeader) {
    container.appendChild(searchHeader);
  }

  if (items.length > 0) {
    items.forEach((item) => {
      const postItem = createPostItem(item);
      container.appendChild(postItem);
    });
  } else {
    container.appendChild(createNoResultsMessage());
  }
}

// Main block function
export default async function decorate(block) {
  // Add class name directly to the block element
  block.classList.add('news-feed-block-content');

  // Get current page from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const currentPage = parseInt(urlParams.get('page'), 10) || 1;
  const limit = 5;

  // Get search query if this is a search block
  const searchQuery = urlParams.get('q') || urlParams.get('location') || urlParams.get('tag') || (urlParams.get('year') && urlParams.get('month')) || '';
  const isSearchBlock = block.classList.contains('search');

  // Create containers
  const newsContainer = document.createElement('div');
  newsContainer.className = 'news-container';

  // Create pagination container only if not on the home page
  const paginationContainer = window.location.pathname !== '/' ? createPaginationContainer() : null;

  async function loadPage(page) {
    function handlePageChange(newPage) {
      const url = new URL(window.location);
      url.searchParams.set('page', newPage);
      window.history.pushState({}, '', url);
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      loadPage(newPage);
    }
    // For search, fetch from all sources
    if (isSearchBlock && searchQuery) {
      try {
        const sources = [
          '/media-releases.json',
          '/speeches.json',
          '/qantas-responds.json',
          '/roo-tales.json',
        ];

        // Fetch data from all sources
        const fetchPromises = sources.map((source) => fetch(source).then((resp) => resp.json()));
        const results = await Promise.all(fetchPromises);

        // Combine all data
        let allData = [];
        results.forEach((result) => {
          if (result && result.data && Array.isArray(result.data)) {
            allData = [...allData, ...result.data];
          }
        });

        const filteredData = filterSearchResults(allData, searchQuery, urlParams);
        // Sort filtered data by date (newest first)
        filteredData.sort((a, b) => {
          const dateA = new Date(a.publisheddate || a.publishDateTime);
          const dateB = new Date(b.publisheddate || b.publishDateTime);
          return dateB - dateA;
        });

        // Format display text for year-month queries
        let displayQuery = searchQuery;
        if (urlParams.get('year') && urlParams.get('month')) {
          const year = urlParams.get('year');
          const monthNum = parseInt(urlParams.get('month'), 10);
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
          const monthName = monthNames[monthNum - 1];
          displayQuery = `${monthName} ${year}`;
        }

        newsContainer.appendChild(createSearchHeader(displayQuery, filteredData.length));
        const paginatedData = filteredData.slice((page - 1) * limit, page * limit);
        displayItems(paginatedData, newsContainer);

        if (window.location.pathname !== '/') {
          updatePagination(filteredData.length, limit, page, handlePageChange);
        }
      } catch (error) {
        newsContainer.innerHTML = '<p>An error occurred while searching. Please try again later.</p>';
      }
      return;
    }

    // Regular (non-search) fetching logic
    let endpoint = '/media-releases.json';
    const currentUrl = window.location.href.toLowerCase();
    if (currentUrl.includes('/speeches/')) {
      endpoint = '/speeches.json';
    } else if (currentUrl.includes('/qantas-responds/') || currentUrl.includes('/featured/')) {
      endpoint = '/qantas-responds.json';
    }

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        // Sort the data by date (newest first)
        const sortedData = sortDataByDate(data.data);
        const paginatedData = sortedData.slice((page - 1) * limit, page * limit);
        displayItems(paginatedData, newsContainer);

        // Only show pagination if not on home page
        if (window.location.pathname !== '/') {
          updatePagination(data.total, limit, page, handlePageChange);
        }
      } else {
        newsContainer.innerHTML = '<p>No items found.</p>';
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      newsContainer.innerHTML = '<p>An error occurred while loading the content.</p>';
    }
  }

  try {
    const firstChildDiv = block.querySelector(':scope > div');
    if (firstChildDiv) {
      firstChildDiv.classList.add('news-feed-block-heading');
      if (window.location.pathname === '/') {
        firstChildDiv.classList.add('home-page');
      }
    }
    // Add containers to the block
    block.appendChild(newsContainer);
    if (paginationContainer) {
      block.appendChild(paginationContainer);
    }

    // Load the initial page
    await loadPage(currentPage);
  } catch (error) {
    console.error('Error:', error);
    block.innerHTML = '<p>An error occurred while loading the content.</p>';
  }
}
