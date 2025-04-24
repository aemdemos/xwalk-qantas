import {
  describe, it, expect, beforeEach,
} from 'vitest';
import decorate from './image-with-link.js';

describe('Image with link block', () => {
  let block;

  beforeEach(() => {
    // Create a fresh block for each test
    block = document.createElement('div');
  });

  it('should wrap image in link when both image and link are present', () => {
    // Setup block with image and link
    block.innerHTML = `
      <div>
        <picture>
          <source type="image/webp" srcset="image.webp">
          <img src="image.jpg" alt="Test Image">
        </picture>
      </div>
      <div>
        <a href="https://example.com">Example Link</a>
      </div>
    `;

    decorate(block);

    // Check the result
    const anchor = block.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor.href).toContain('example.com');
    expect(anchor.querySelector('picture')).not.toBeNull();
    expect(anchor.querySelector('img')).not.toBeNull();
    expect(anchor.querySelector('img').getAttribute('src')).toBe('image.jpg');
  });

  it('should use link title when available', () => {
    // Setup block with image and link with title
    block.innerHTML = `
      <div>
        <picture>
          <img src="image.jpg" alt="Test Image">
        </picture>
      </div>
      <div>
        <a href="https://example.com" title="Link Title">Example Link</a>
      </div>
    `;

    decorate(block);

    const anchor = block.querySelector('a');
    expect(anchor.title).toBe('Link Title');
  });

  it('should fallback to image alt when link title is not available', () => {
    // Setup block with image alt but no link title
    block.innerHTML = `
      <div>
        <picture>
          <img src="image.jpg" alt="Test Image Alt">
        </picture>
      </div>
      <div>
        <a href="https://example.com">Example Link</a>
      </div>
    `;

    decorate(block);

    const anchor = block.querySelector('a');
    expect(anchor.title).toBe('Test Image Alt');
  });

  it('should handle empty title gracefully', () => {
    // Setup block with no titles or alts
    block.innerHTML = `
      <div>
        <picture>
          <img src="image.jpg">
        </picture>
      </div>
      <div>
        <a href="https://example.com">Example Link</a>
      </div>
    `;

    decorate(block);

    const anchor = block.querySelector('a');
    expect(anchor.title).toBe('');
  });

  it('should not modify block when image is missing', () => {
    // Setup block with link but no image
    const originalHTML = `
      <div></div>
      <div>
        <a href="https://example.com">Example Link</a>
      </div>
    `;
    block.innerHTML = originalHTML;

    decorate(block);

    // Block should remain unchanged
    expect(block.innerHTML).toBe(originalHTML);
  });

  it('should not modify block when link is missing', () => {
    // Setup block with image but no link
    const originalHTML = `
      <div>
        <picture>
          <img src="image.jpg" alt="Test Image">
        </picture>
      </div>
      <div></div>
    `;
    block.innerHTML = originalHTML;

    decorate(block);

    // Block should remain unchanged
    expect(block.innerHTML).toBe(originalHTML);
  });
});
