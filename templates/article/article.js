import { div } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  // Find section with class side-navigation-container
  const sideNavContainer = block.querySelector('.section.side-navigation-container');
  if (sideNavContainer) {
    const articleWrapper = div({ class: 'article-wrapper' });

    // Create a wrapper for content divs
    const contentWrapper = div({ class: 'content-wrapper' });

    // Loop through all children of the side nav container
    const children = Array.from(sideNavContainer.children);
    children.forEach((child) => {
      // If it's the side navigation wrapper, add it directly to article wrapper
      if (child.classList.contains('side-navigation-wrapper')) {
        articleWrapper.appendChild(child);
      } else {
        // All other elements go into the content wrapper
        contentWrapper.appendChild(child);
      }
    });

    // Add the content wrapper to the article wrapper
    articleWrapper.appendChild(contentWrapper);

    // Add the article wrapper back to the container
    sideNavContainer.appendChild(articleWrapper);
  }
}
