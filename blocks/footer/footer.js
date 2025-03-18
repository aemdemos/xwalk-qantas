import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Add specific classes to sections
  const sections = footer.querySelectorAll('.section');
  const sectionClasses = ['logos', 'left-nav', 'useful-links', 'copyright'];

  sections.forEach((section, index) => {
    if (index < sectionClasses.length) {
      section.classList.add(sectionClasses[index]);
    }
  });

  // Create a wrapper for social icons
  const logosSection = footer.querySelector('.logos .default-content-wrapper');
  if (logosSection) {
    const socialIconsWrapper = document.createElement('div');
    socialIconsWrapper.className = 'social-icons-wrapper';

    // Move all paragraphs except the first one (logo) into the wrapper
    const paragraphs = Array.from(logosSection.querySelectorAll('p'));
    paragraphs.forEach((p, index) => {
      if (index === 0) {
        // First paragraph is the logo
        const img = document.createElement('img');
        img.src = '/icons/qantas-logo-2.svg';
        img.alt = 'Qantas Logo';
        img.width = 120;
        p.textContent = '';
        p.appendChild(img);
      } else {
        // Add FA classes and move to wrapper
        const text = p.textContent.trim().toLowerCase();
        if (text.includes('facebook')) {
          p.className = 'fa fa-facebook';
        } else if (text.includes('twitter')) {
          p.className = 'fa fa-twitter';
        } else if (text.includes('instagram')) {
          p.className = 'fa fa-instagram';
        } else if (text.includes('linkedin')) {
          p.className = 'fa fa-linkedin';
        } else if (text.includes('youtube')) {
          p.className = 'fa fa-youtube';
        }
        socialIconsWrapper.appendChild(p);
      }
    });

    logosSection.appendChild(socialIconsWrapper);
  }

  block.append(footer);
}
