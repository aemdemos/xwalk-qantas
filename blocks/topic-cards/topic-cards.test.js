import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import decorate from './topic-cards.js';

// Mock the imported functions
vi.mock('../../scripts/aem.js', () => ({
  createOptimizedPicture: vi.fn((src, alt) => {
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    picture.appendChild(img);
    return picture;
  }),
}));

vi.mock('../../scripts/scripts.js', () => ({
  moveInstrumentation: vi.fn((source, target) => {
    // Mock implementation that copies data attributes
    const dataAttributes = [...source.attributes]
      .filter((attr) => attr.name.startsWith('data-'));

    dataAttributes.forEach((attr) => {
      target.setAttribute(attr.name, attr.value);
    });
  }),
}));

describe('Topic Cards block', () => {
  let block;
  let originalLocation;

  beforeEach(() => {
    // Save original window.location
    originalLocation = window.location;

    // Replace window.location with a mock object
    delete window.location;
    window.location = { href: '' };

    // Create a fresh block for each test
    block = document.createElement('div');
  });

  afterEach(() => {
    // Restore original window.location
    window.location = originalLocation;
  });

  it('should convert divs to ul/li structure', () => {
    // Set up block with two cards
    block.innerHTML = `
      <div>
        <div><p>Card 1 Content</p></div>
      </div>
      <div>
        <div><p>Card 2 Content</p></div>
      </div>
    `;

    decorate(block);

    // Check if structure was transformed to ul/li
    const ul = block.querySelector('ul');
    expect(ul).not.toBeNull();

    const items = ul.querySelectorAll('li');
    expect(items.length).toBe(2);

    // Check content was preserved
    expect(items[0].textContent).toContain('Card 1 Content');
    expect(items[1].textContent).toContain('Card 2 Content');
  });

  it('should apply correct class names based on content', () => {
    // Setup block with different types of content
    block.innerHTML = `
      <div>
        <div>
          <picture>
            <img src="test.jpg" alt="Test Image">
          </picture>
        </div>
        <div>
          <p>Some text</p>
        </div>
        <div>
          <div class="button-container">
            <a href="https://example.com">Learn More</a>
          </div>
        </div>
        <div>
          <span class="icon">★</span>
        </div>
      </div>
    `;

    decorate(block);

    // Check if classes were applied correctly
    const li = block.querySelector('li');
    expect(li.querySelector('.cards-card-image')).not.toBeNull();
    expect(li.querySelector('.cards-card-body')).not.toBeNull();
    expect(li.querySelector('.cards-card-link')).not.toBeNull();
    expect(li.querySelector('.cards-card-icon')).not.toBeNull();
  });

  it('should optimize images', () => {
    // Setup block with an image
    block.innerHTML = `
      <div>
        <div>
          <picture>
            <img src="test.jpg" alt="Test Image" data-test-attr="value">
          </picture>
        </div>
      </div>
    `;

    decorate(block);

    // Check if image was replaced with optimized picture
    const img = block.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.src).toContain('test.jpg');

    // Check if instrumentation was moved
    expect(img.getAttribute('data-test-attr')).toBe('value');
  });

  it('should make cards clickable', () => {
    // Setup block with a link
    block.innerHTML = `
      <div>
        <div>
          <p>Card Content</p>
        </div>
        <div>
          <div class="button-container">
            <a href="https://example.com">Learn More</a>
          </div>
        </div>
      </div>
    `;

    decorate(block);

    // Get the card and simulate click
    const card = block.querySelector('li');
    expect(card.style.cursor).toBe('pointer');

    // Reset the href to make sure it changes
    window.location.href = '';

    // Simulate a click on the card (not on the link)
    card.click();

    // Check if location was changed
    expect(window.location.href).toBe('https://example.com');
  });

  it('should not redirect when clicking on the actual link', () => {
    // Setup block with a link
    block.innerHTML = `
      <div>
        <div>
          <p>Card Content</p>
        </div>
        <div>
          <div class="button-container">
            <a href="https://example.com">Learn More</a>
          </div>
        </div>
      </div>
    `;

    decorate(block);

    // Get the link element
    const link = block.querySelector('a');

    // Reset the href to make sure it doesn't change
    window.location.href = '';

    // Create a custom event that simulates clicking on the link
    // The event needs to have a target property with closest method
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });

    // Override the target and add closest method
    Object.defineProperty(clickEvent, 'target', { value: link });

    // Add closest method to event target
    clickEvent.target.closest = (selector) => {
      if (selector === 'a' && link.matches(selector)) {
        return link;
      }
      return null;
    };

    // Dispatch the event on the card
    const card = block.querySelector('li');
    card.dispatchEvent(clickEvent);

    // Check that location was not changed (link's default behavior would handle it)
    expect(window.location.href).toBe('');
  });

  it('should handle cards without links', () => {
    // Setup block without links
    block.innerHTML = `
      <div>
        <div>
          <p>Card without link</p>
        </div>
      </div>
    `;

    decorate(block);

    // Get the card
    const card = block.querySelector('li');

    // Card should not be clickable
    expect(card.style.cursor).not.toBe('pointer');

    // Reset the href to make sure it doesn't change
    window.location.href = '';

    // Simulate a click
    card.click();

    // No redirect should happen
    expect(window.location.href).toBe('');
  });
});
