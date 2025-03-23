export default async function decorate(block) {
  try {
    // Fetch the data from the API endpoint
    const latestNews = await fetch('/media-releases.json');
    const latestNewsData = await latestNews.json();

    // Validate that we have data to work with
    if (!latestNewsData || !latestNewsData.data || !Array.isArray(latestNewsData.data)) {
      console.error('Invalid news data format:', latestNewsData);
      block.innerHTML = '<p>Unable to load news at this time.</p>';
      return;
    }

    // Clear the block content
    block.textContent = '';

    // Create a container for the news feed
    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container';

    // Process each news item
    latestNewsData.data.forEach((item) => {
      // Create a post item container that will hold both image and text
      const postItem = document.createElement('div');
      postItem.className = 'post-item';

      // Add the image if available
      if (item.image) {
        const postImage = document.createElement('div');
        postImage.className = 'post-image';

        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.title || 'News image';
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
      postMeta.textContent = item.publicationDate || item.publishedDate || '';

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

    // Add the news container to the block
    block.appendChild(newsContainer);
  } catch (error) {
    console.error('Error building news feed:', error);
    block.innerHTML = '<p>An error occurred while loading the news feed.</p>';
  }
}
