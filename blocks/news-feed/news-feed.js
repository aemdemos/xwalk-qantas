import {
  a, div, h2, li, p, ul,
} from '../../scripts/dom-helpers.js';
import { buildBlock, decorateBlock, getMetadata } from '../../scripts/aem.js';

export default async function decorate(block) {
  const outDiv = div();
  const latestNews = await fetch('/media-releases.json');
  const latestNewsData = await latestNews.json();
  const ulTemp = ul();
  latestNewsData.forEach((item) => {
    // create li having a having breadcrumb-title as link and publication-date
    const liTemp = li(a({ href: item.path }, item.title), item['publication-date']);
    ulTemp.appendChild(liTemp);
  });
  const latestNewsDiv = div(h2('Latest News'), ulTemp);
  const tempDiv = div(buildBlock('text', { elems: [latestNewsDiv] }));

  if (tempDiv?.querySelector('div')) {
    tempDiv.querySelector('div').classList.add('blue-background');
    decorateBlock(tempDiv.querySelector('div'));
  }
  tempDiv.classList.add('text-wrapper');
  const textSection = div({
    class: 'section text-container',
    'data-section-status': 'initialized',
  });
  textSection.style.display = 'none';
  textSection.appendChild(tempDiv);

  // Move all sections to wrapper div except breadcrumb
  const sections = block.querySelectorAll('.section');
  sections.forEach((section) => {
    if (!section.classList.contains('breadcrumb-container')) {
      section.querySelector('.default-content-wrapper')
        ?.prepend(p({ class: 'publication-date' }, getMetadata('publication-date')));
      outDiv.appendChild(section);
    }
  });

  outDiv.appendChild(textSection);

  // Clear the block and add breadcrumb (if exists) and wrapper div
  block.innerHTML = '';
  outDiv.querySelectorAll('a').forEach((anchor) => {
    anchor.classList.remove('button');
  });

  block.appendChild(outDiv);
}
