import { div } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  // Find section with class side-navigation-container
  const sideNavContainer = block.querySelector('.section.side-navigation-container');
  if (sideNavContainer) {
    const articleWrapper = div({ class: 'article-wrapper' });
    while (sideNavContainer.firstChild) {
      articleWrapper.appendChild(sideNavContainer.firstChild);
    }
    sideNavContainer.appendChild(articleWrapper);
  }
}
