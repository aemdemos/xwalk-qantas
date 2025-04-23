/**
 * @vitest-environment jsdom
 */

import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import decorate from './cards.js';

// Mock dependencies
vi.mock('../../scripts/aem.js', () => ({
  createOptimizedPicture: vi.fn().mockImplementation(() => {
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.dataset.optimized = 'true';
    picture.appendChild(img);
    return picture;
  }),
}));

vi.mock('../../scripts/scripts.js', () => ({
  moveInstrumentation: vi.fn(),
}));

vi.mock('../../scripts/util.js', () => ({
  formatDate: vi.fn((date) => `Formatted: ${date}`),
  formatDateNoTime: vi.fn((date) => `Date Only: ${date}`),
  sortDataByDate: vi.fn((data) => data),
}));

describe('Cards Block', () => {
  // Mock fetch globally
  global.fetch = vi.fn();

  let block;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset fetch mock
    global.fetch.mockReset().mockResolvedValue({
      json: () => Promise.resolve({ data: [] }),
    });

    // Create a new block for each test
    block = document.createElement('div');

    // Mock document.querySelector for metadata
    document.querySelector = vi.fn().mockReturnValue({
      content: '2023-01-01T12:00:00.00',
    });

    // Set default URL location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/', search: '' },
      writable: true,
    });
  });

  it('handles default cards by converting to ul/li structure', async () => {
    // Setup
    block.innerHTML = '<div><div>Test Content</div></div>';

    // Execute
    await decorate(block);

    // Verify the decorate function executed without errors
    expect(block.children.length).toBeGreaterThan(0);
    expect(block.innerHTML.toLowerCase()).toContain('ul');
  });

  it('fetches data for roo-tales cards', async () => {
    // Setup
    block.classList.add('roo-tales');

    // Execute
    await decorate(block);

    // Verify fetch was called with correct endpoint
    expect(global.fetch).toHaveBeenCalledWith('/roo-tales.json');
  });

  it('fetches data for new-galleries cards', async () => {
    // Setup
    block.classList.add('new-galleries');

    // Execute
    await decorate(block);

    // Verify fetch was called with correct endpoint
    expect(global.fetch).toHaveBeenCalledWith('/gallery.json');
  });

  it('fetches data for teaser cards', async () => {
    // Setup
    block.classList.add('teaser');
    block.innerHTML = '<div><div>Test Content</div></div>';

    // Execute
    await decorate(block);

    // Verify fetch was called with correct endpoint
    expect(global.fetch).toHaveBeenCalledWith('/gallery.json');
  });

  it('handles fetch errors gracefully for roo-tales', async () => {
    // Setup
    block.classList.add('roo-tales');
    global.fetch.mockRejectedValue(new Error('Network error'));

    // Execute
    await decorate(block);

    // Verify error message was displayed
    expect(block.innerHTML).toBe('<p>Error loading content.</p>');
  });

  it('handles fetch errors gracefully for new-galleries', async () => {
    // Setup
    block.classList.add('new-galleries');
    global.fetch.mockRejectedValue(new Error('Network error'));

    // Execute
    await decorate(block);

    // Verify error container was created
    expect(block.firstChild.tagName).toBe('DIV');
    expect(block.textContent).toContain('Error loading galleries');
  });
});
