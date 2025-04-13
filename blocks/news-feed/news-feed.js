import { formatDate, sortDataByDate } from '../../scripts/util.js';

export default async function decorate(block) {
  // Add class name directly to the block element
  block.classList.add('news-feed-block-content'); // Add your desired class name here

  // Get current page from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const currentPage = parseInt(urlParams.get('page'), 10) || 1;
  const limit = 5;

  // Get search query if this is a search block
  const searchQuery = urlParams.get('q') || urlParams.get('location') || urlParams.get('tag') || (urlParams.get('year') && urlParams.get('month')) || '';
  const isSearchBlock = block.classList.contains('search');

  // Create containers first
  const newsContainer = document.createElement('div');
  newsContainer.className = 'news-container';

  // Create pagination container only if not on the home page
  const paginationContainer = window.location.pathname !== '/' ? document.createElement('div') : null;
  if (paginationContainer) {
    paginationContainer.className = 'pagination';
  }

  // Function to create a post item
  function createPostItem(item) {
    // Create a post item container that will hold both image and tex
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

    // Create and add the excerpt wrapper and excerp
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

    // Add the post text to the post item container
    postItem.appendChild(postText);

    return postItem;
  }

  // Function to create no results message
  function createNoResultsMessage() {
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <h3>No results found</h3>
      <p>Your search did not match any documents. Please try different keywords or browse our sections.</p>
    `;
    return noResults;
  }

  // Function to display items in the news container
  function displayItems(items) {
    // Clear existing conten
    if (items.length > 0) {
      items.forEach((item) => {
        const postItem = createPostItem(item);
        newsContainer.appendChild(postItem);
      });
    } else {
      newsContainer.appendChild(createNoResultsMessage());
    }
  }

  // Function declarations at root level
  // Function to update pagination UI
  function updatePagination(totalItems, itemsPerPage, pageNum) {
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
        // eslint-disable-next-line no-use-before-define
        loadPage(i);
        const url = new URL(window.location);
        url.searchParams.set('page', i);
        window.history.pushState({}, '', url);
        // Scroll to top of page with smooth animation
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
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
        const nextPage = pageNum + 1;
        // eslint-disable-next-line no-use-before-define
        loadPage(nextPage);
        const url = new URL(window.location);
        url.searchParams.set('page', nextPage);
        window.history.pushState({}, '', url);
        // Scroll to top of page with smooth animation
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      });

      paginationContainer.appendChild(nextLink);
    }
  }

  async function loadPage(page) {
    // Calculate offset based on page number - variable still needed for search function
    // For search, fetch from all sources
    if (isSearchBlock && searchQuery) {
      // Clear existing conten
      newsContainer.innerHTML = '';

      try {
        // Fetch from all sources for search
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

        // Filter based on search query
        const isTopicTagUrl = window.location.href.toLowerCase().includes('topic?tag=');
        const isYearMonthFilter = urlParams.get('year') && urlParams.get('month');
        const isLocationFilter = urlParams.get('location') !== null;

        const filteredData = allData.filter((item) => {
          // If this is a topic?tag= URL, filter by pagetopics
          if (isTopicTagUrl) {
            const tag = searchQuery.toLowerCase();
            const itemTopics = (item.pagetopics || '').toString().toLowerCase();
            return itemTopics.split(',').map((t) => t.trim()).some((topic) => topic === tag);
          }

          // If year and month parameters are present, filter by date
          if (isYearMonthFilter) {
            const year = urlParams.get('year');
            const month = urlParams.get('month').padStart(2, '0'); // Ensure month is 2 digits
            const datePrefix = `${year}-${month}`;

            // Check publisheddate and publishDateTime fields
            const publishedDate = item.publisheddate || item.publishDateTime || '';

            // If the date starts with our year-month prefix, it's a match
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

        // Add search header
        const searchHeader = document.createElement('div');
        searchHeader.className = 'search-results-header';

        // Format nice display text for year-month queries
        let displayQuery = searchQuery;
        if (urlParams.get('year') && urlParams.get('month')) {
          const year = urlParams.get('year');
          const monthNum = parseInt(urlParams.get('month'), 10);
          // Convert month number to month name
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
          const monthName = monthNames[monthNum - 1]; // Adjust for zero-based array
          displayQuery = `${monthName} ${year}`;
        }

        const resultsHeading = document.createElement('h2');
        resultsHeading.textContent = `Search results for "${displayQuery}"`;
        const resultsCount = document.createElement('p');
        resultsCount.textContent = `${filteredData.length} results found`;
        searchHeader.appendChild(resultsHeading);
        searchHeader.appendChild(resultsCount);
        newsContainer.appendChild(searchHeader);

        // Paginate results
        const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

        // Display results
        displayItems(paginatedData);

        // Update pagination
        if (window.location.pathname !== '/') {
          updatePagination(filteredData.length, limit, page);
        }

        return; // Exit early since we've handled search separately
      } catch (error) {
        newsContainer.innerHTML = '<p>An error occurred while searching. Please try again later.</p>';
        return;
      }
    }

    // Regular (non-search) fetching logic - fetch full JSON and sort manually
    let endpoint = '/media-releases.json';

    const currentUrl = window.location.href.toLowerCase();
    if (currentUrl.includes('/speeches/')) {
      endpoint = '/speeches.json';
    } else if (currentUrl.includes('/qantas-responds/')
      || currentUrl.includes('/featured/')) {
      endpoint = '/qantas-responds.json';
    }

    try {
      // Fetch the data from the appropriate API endpoin
      const response = await fetch(endpoint);
      const data = await response.json();

      // Check if we have data
      if (data && data.data && Array.isArray(data.data)) {
        // Sort the data by date (newest first)
        const sortedData = sortDataByDate(data.data);

        // Get paginated slice of the sorted data
        const paginatedData = sortedData.slice((page - 1) * limit, page * limit);

        // Display the items
        displayItems(paginatedData);

        // Only show pagination if not on home page
        if (window.location.pathname !== '/') {
          updatePagination(data.total, limit, page);
        }
      } else {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'No items found.';
        newsContainer.innerHTML = '';
        newsContainer.appendChild(errorMessage);
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
    // eslint-disable-next-line no-console
    console.error('Error:', error);
    block.innerHTML = '<p>An error occurred while loading the content.</p>';
  }
}
