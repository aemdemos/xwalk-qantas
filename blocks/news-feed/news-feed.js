export default async function decorate(block) {
  // Check if the block is for speeches or qantas-responds by examining its content
  const blockContent = block.textContent.trim().toLowerCase();

  // Get current page from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const currentPage = parseInt(urlParams.get('page'), 10) || 1;
  const limit = 5;

  // Create containers first
  const newsContainer = document.createElement('div');
  newsContainer.className = 'news-container';

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination';

  // Function declarations at root level
  async function loadPage(page) {
    // Calculate offset based on page number
    const offset = (page - 1) * limit;

    // Determine which endpoint to use based on content
    let endpoint = `/media-releases.json?limit=${limit}&offset=${offset}`; // Default endpoint

    if (blockContent.includes('speeches')) {
      endpoint = `/speeches.json?limit=${limit}&offset=${offset}`;
    } else if (blockContent.includes('qantas-responds')) {
      endpoint = `/qantas-responds.json?limit=${limit}&offset=${offset}`;
    }

    // Fetch the data from the appropriate API endpoint
    const response = await fetch(endpoint);
    const data = await response.json();

    // Clear existing content
    newsContainer.innerHTML = '';

    // Process each news item
    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach((item) => {
        // Create a post item container that will hold both image and text
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
        postMeta.textContent = publishedLocation + (item.publisheddate || item.publicationDate || '');

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

        // Add the post text to the post item container
        postItem.appendChild(postText);

        // Add the completed post item to the news container
        newsContainer.appendChild(postItem);
      });

      // Update pagination
      // eslint-disable-next-line no-use-before-define
      updatePagination(data.total, limit, page);
    } else {
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'No items found.';
      newsContainer.appendChild(errorMessage);
    }
  }

  // Function to update pagination UI - moved before loadPage
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
        loadPage(i);
        const url = new URL(window.location);
        url.searchParams.set('page', i);
        window.history.pushState({}, '', url);
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
        loadPage(nextPage);
        const url = new URL(window.location);
        url.searchParams.set('page', nextPage);
        window.history.pushState({}, '', url);
      });

      paginationContainer.appendChild(nextLink);
    }
  }

  try {
    // Clear the block content
    block.textContent = '';

    // Add containers to the block
    block.appendChild(newsContainer);
    block.appendChild(paginationContainer);

    // Load the initial page
    await loadPage(currentPage);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error:', error);
    block.innerHTML = '<p>An error occurred while loading the content.</p>';
  }
}
