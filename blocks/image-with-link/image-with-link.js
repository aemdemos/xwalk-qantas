/**
 * Decorates the image-with-link block
 * @param {HTMLElement} block The image-with-link block element
 */
export default function decorate(block) {
  // Get the image and link elements
  const imageDiv = block.children[0];
  const linkDiv = block.children[1];

  if (imageDiv && linkDiv) {
    // Extract the image
    const picture = imageDiv.querySelector('picture');
    const img = imageDiv.querySelector('img');

    // Extract the link URL
    const linkElement = linkDiv.querySelector('a');
    const linkUrl = linkElement ? linkElement.getAttribute('href') : null;

    // Get title from link or fall back to image alt
    let linkTitle = '';
    if (linkElement && linkElement.getAttribute('title')) {
      linkTitle = linkElement.getAttribute('title');
    } else if (img && img.getAttribute('alt')) {
      linkTitle = img.getAttribute('alt');
    }

    if (picture && linkUrl) {
      // Create a new anchor element
      const anchor = document.createElement('a');
      anchor.href = linkUrl;
      anchor.title = linkTitle;

      // Add the picture to the anchor
      anchor.appendChild(picture);

      // Clear the block and add the anchor with image
      block.innerHTML = '';
      block.appendChild(anchor);
    }
  }
}
