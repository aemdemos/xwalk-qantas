export default async function decorate(block) {
  try {
    // Check if the block is for speeches or qantas-responds by examining its content
    const blockContent = block.textContent.trim().toLowerCase();

    // Determine which endpoint to use based on content
    let endpoint = '/media-releases.json'; // Default endpoint

    if (blockContent.includes('speeches')) {
      endpoint = '/speeches.json';
    } else if (blockContent.includes('qantas-responds')) {
      endpoint = '/qantas-responds.json';
    }

    // Fetch the data from the appropriate API endpoint
    const response = await fetch(endpoint);
    const data = await response.json();

    // Clear the block content
    block.textContent = '';

    // Create a container for the news feed
    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container';

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
    } else {
      console.error('Invalid data format from:', endpoint);
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'No items found.';
      newsContainer.appendChild(errorMessage);
    }
    block.appendChild(newsContainer);
  } catch (error) {
    block.innerHTML = '<p>An error occurred while loading the content.</p>';
  }
}
