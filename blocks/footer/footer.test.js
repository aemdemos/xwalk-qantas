import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import decorate from './footer.js';

// Mock the getMetadata function
vi.mock('../../scripts/aem.js', () => ({
  getMetadata: vi.fn(() => '/mock-footer-path'),
}));

// Mock the loadFragment function
vi.mock('../fragment/fragment.js', () => ({
  loadFragment: vi.fn(async () => {
    const fragment = document.createElement('div');
    // Create mock sections that would be in the footer fragment
    for (let i = 0; i < 4; i += 1) {
      const section = document.createElement('div');
      section.className = 'section';

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'default-content-wrapper';

      // Add mock content to the first section (logos)
      if (i === 0) {
        // Logo paragraph
        const logoPara = document.createElement('p');
        logoPara.textContent = 'Logo';
        contentWrapper.appendChild(logoPara);

        // Social media paragraphs
        const socialTypes = ['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'YouTube'];
        socialTypes.forEach((type) => {
          const socialPara = document.createElement('p');
          socialPara.textContent = type;
          contentWrapper.appendChild(socialPara);
        });
      }

      // Add content to navigation sections
      if (i === 1 || i === 2) {
        const links = ['Link 1', 'Link 2', 'Link 3'];
        links.forEach((linkText) => {
          const para = document.createElement('p');
          const link = document.createElement('a');
          link.textContent = linkText;
          link.className = 'button';
          para.appendChild(link);
          contentWrapper.appendChild(para);
        });
      }

      // Add content to copyright section
      if (i === 3) {
        const copyrightPara = document.createElement('p');
        copyrightPara.textContent = '© 2023 Qantas Airways';
        contentWrapper.appendChild(copyrightPara);
      }

      section.appendChild(contentWrapper);
      fragment.appendChild(section);
    }
    return fragment;
  }),
}));

describe('Footer block', () => {
  let block;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock block element
    block = document.createElement('div');
    block.innerHTML = '<div>Original content</div>';
  });

  it('should clear the block content and append a decorated footer', async () => {
    await decorate(block);

    // Check if original content was cleared
    expect(block.textContent).not.toContain('Original content');

    // Check if footer was appended
    const footer = block.querySelector('div');
    expect(footer).not.toBeNull();
  });

  it('should add correct section classes', async () => {
    await decorate(block);

    const sections = block.querySelectorAll('.section');
    expect(sections[0].classList.contains('logos')).toBe(true);
    expect(sections[1].classList.contains('left-nav')).toBe(true);
    expect(sections[2].classList.contains('useful-links')).toBe(true);
    expect(sections[3].classList.contains('copyright')).toBe(true);
  });

  it('should create a social icons wrapper', async () => {
    await decorate(block);

    const socialIconsWrapper = block.querySelector('.social-icons-wrapper');
    expect(socialIconsWrapper).not.toBeNull();
  });

  it('should replace the first paragraph with a Qantas logo', async () => {
    await decorate(block);

    const logoImg = block.querySelector('.logos p:first-child img');
    expect(logoImg).not.toBeNull();
    expect(logoImg.src.endsWith('/icons/qantas-logo-2.svg')).toBe(true);
    expect(logoImg.alt).toBe('Qantas Logo');
  });

  it('should add correct Font Awesome classes to social media links', async () => {
    await decorate(block);

    const socialIcons = block.querySelectorAll('.social-icons-wrapper p');
    expect(socialIcons.length).toBe(5);

    expect(socialIcons[0].classList.contains('fa-facebook')).toBe(true);
    expect(socialIcons[1].classList.contains('fa-twitter')).toBe(true);
    expect(socialIcons[2].classList.contains('fa-instagram')).toBe(true);
    expect(socialIcons[3].classList.contains('fa-linkedin')).toBe(true);
    expect(socialIcons[4].classList.contains('fa-youtube')).toBe(true);
  });

  it('should move social icons to the wrapper', async () => {
    await decorate(block);

    const logosSection = block.querySelector('.logos .default-content-wrapper');
    const socialIconsWrapper = block.querySelector('.social-icons-wrapper');

    // Logo paragraph should be directly in the logos section
    expect(logosSection.children[0].tagName.toLowerCase()).toBe('p');
    expect(logosSection.children[1]).toBe(socialIconsWrapper);

    // Social icons should be in the wrapper
    const socialIcons = socialIconsWrapper.querySelectorAll('p');
    expect(socialIcons.length).toBe(5);
  });
});
