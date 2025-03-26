export default async function decorate(block) {
  try {
    // Check if the block is for speeches or qantas-responds by examining its content
    const blockContent = block.textContent.trim().toLowerCase();

    // Change the page detection at the start of the function
    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('page')) || 1;

    const limit = 5;
    // Function to load content for a specific page
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
        updatePagination(data.total, limit, page);
      } else {
        errorMessage.textContent = 'No items found.';
        newsContainer.appendChild(errorMessage);
      }
    }

    // Function to update pagination UI
    function updatePagination(totalItems, itemsPerPage, currentPage) {
      // Clear existing pagination
      paginationContainer.innerHTML = '';

      // Calculate total pages
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      // Determine how many page numbers to show
      const maxVisiblePages = 8;
      let startPage;
      let endPage;

      if (totalPages <= maxVisiblePages) {
        // If total pages is less than max visible, show all pages
        startPage = 1;
        endPage = totalPages;
      } else {
        // Calculate start and end pages based on current page position
        if (currentPage <= 4) {
          // If current page is in first 4 pages
          startPage = 1;
          endPage = 7;
        } else if (currentPage >= totalPages - 3) {
          // If current page is in last 4 pages
          startPage = totalPages - 6;
          endPage = totalPages;
        } else {
          // Current page is in the middle
          startPage = currentPage - 3;
          endPage = currentPage + 3;
        }
      }

      // Create numbered page links
      for (let i = startPage; i <= endPage; i++) {
        const pageLink = document.createElement('a');
        pageLink.href = '#';
        pageLink.textContent = i.toString();
        pageLink.className = 'page-link';

        if (i === currentPage) {
          pageLink.classList.add('current');
        }

        // Add click event handler...
        pageLink.addEventListener('click', (e) => {
          e.preventDefault();
          loadPage(i);
          // Update URL using query parameter
          const url = new URL(window.location);
          url.searchParams.set('page', i);
          window.history.pushState({}, '', url);
        });

        paginationContainer.appendChild(pageLink);
      }

      // Add next page button if not on last page
      if (currentPage < totalPages) {
        const nextLink = document.createElement('a');
        nextLink.href = '#';
        nextLink.textContent = '>';
        nextLink.className = 'page-link next';

        // Add click event handler...
        nextLink.addEventListener('click', (e) => {
          e.preventDefault();
          const nextPage = currentPage + 1;
          loadPage(nextPage);
          // Update URL using query parameter
          const url = new URL(window.location);
          url.searchParams.set('page', nextPage);
          window.history.pushState({}, '', url);
        });

        paginationContainer.appendChild(nextLink);
      }
    }

    // Clear the block content
    block.textContent = '';

    // Create a container for the news feed
    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container';

    // Create pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';

    // Add containers to the block
    block.appendChild(newsContainer);
    block.appendChild(paginationContainer);

    // Load the initial page
    await loadPage(currentPage);
  } catch (error) {
    console.error('Error:', error);
    block.innerHTML = '<p>An error occurred while loading the content.</p>';
  }
}
