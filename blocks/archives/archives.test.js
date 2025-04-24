import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import decorate from './archives.js';

// Mock DOM elements and fetch responses
const mockBlock = {
  innerHTML: '',
  children: [
    {
      querySelector: () => ({ innerHTML: 'For previous years\' press releases, <a href="#">click here</a>.' }),
    },
  ],
  appendChild: vi.fn(),
};

// Mock fetch response with test data
global.fetch = vi.fn(() => Promise.resolve({
  json: () => Promise.resolve({
    data: [
      {
        publisheddate: '2023-12-10T12:00:00.00',
        title: 'Test Release 1',
      },
      {
        publisheddate: '2022-11-05T14:30:00.00',
        title: 'Test Release 2',
      },
    ],
  }),
}));

// Mock DOM API
document.createElement = (tag) => {
  const element = {
    tagName: tag.toUpperCase(),
    className: '',
    children: [],
    style: {},
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    hasAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    appendChild: vi.fn((child) => {
      element.children.push(child);
      return child;
    }),
    querySelector: vi.fn(() => ({
      cloneNode: vi.fn(() => ({ style: {} })),
    })),
    addEventListener: vi.fn(),
  };
  return element;
};

describe('Archives Block', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBlock.innerHTML = '';
    mockBlock.appendChild.mockClear();
  });

  it('fetches and processes media releases data', async () => {
    await decorate(mockBlock);

    // Verify fetch was called with the correct endpoint
    expect(global.fetch).toHaveBeenCalledWith('/media-releases.json');

    // Verify block elements were created
    expect(mockBlock.appendChild).toHaveBeenCalled();
    expect(mockBlock.innerHTML).toBe('');
  });

  it('handles fetch errors gracefully', async () => {
    // Mock fetch to throw an error
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    await decorate(mockBlock);

    // Verify error message is shown
    expect(mockBlock.innerHTML).toBe('<p>An error occurred while loading the archives.</p>');
  });
});
