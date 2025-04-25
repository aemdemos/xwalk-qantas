import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { JSDOM } from 'jsdom';
import decorate from './news-feed.js';

// Mock the utils module
vi.mock('../../scripts/util.js', () => ({
  formatDate: vi.fn((date) => `formatted: ${date}`),
  sortDataByDate: vi.fn((data) => data.sort(
    (a, b) => new Date(b.publisheddate) - new Date(a.publisheddate),
  )),
}));

describe('News Feed Block', () => {
  let dom;
  let window;
  let document;
  let mockFetch;

  // Setup DOM environment before each test
  beforeEach(() => {
    // Create a new JSDOM instance
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://example.qantas.com/media-releases',
      referrer: 'https://example.qantas.com',
      contentType: 'text/html',
    });

    window = dom.window;
    document = window.document;

    // Mock fetch API
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Setup global objects that are used in the component
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;
    global.Element = window.Element;

    // Create a basic block structure
    const block = document.createElement('div');
    block.innerHTML = `
      <div>News Feed Content</div>
    `;
    document.body.appendChild(block);
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    global.fetch = undefined;
  });

  describe('Main Decorate Function', () => {
    it('should setup news feed block correctly', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          data: [],
          total: 0,
        }),
      });

      const block = document.querySelector('div');
      await decorate(block);

      expect(block.classList.contains('news-feed-block-content')).toBe(true);
      expect(block.querySelector('.news-container')).not.toBeNull();
    });

    it('should handle search functionality', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          data: [
            { title: 'Search Result 1', description: 'Test description 1', path: '/test1' },
            { title: 'Search Result 2', description: 'Test description 2', path: '/test2' },
            { title: 'Search Result 3', description: 'Test description 3', path: '/test3' },
            { title: 'Search Result 4', description: 'Test description 4', path: '/test4' },
            { title: 'Search Result 5', description: 'Test description 5', path: '/test5' },
          ],
          total: 5,
        }),
      });

      const block = document.querySelector('div');
      block.classList.add('search');
      // Mock URL parameters
      const url = new URL(window.location.href);
      url.searchParams.set('q', 'test');
      window.history.pushState({}, '', url);
      await decorate(block);
      // Verify search results
      const postItems = block.querySelectorAll('.post-item');
      expect(postItems.length).toBe(5);
      // Verify post item content
      expect(postItems[0].querySelector('.post-title').textContent).toBe('Search Result 1');
      expect(postItems[1].querySelector('.post-title').textContent).toBe('Search Result 2');
      expect(postItems[2].querySelector('.post-title').textContent).toBe('Search Result 3');
      expect(postItems[3].querySelector('.post-title').textContent).toBe('Search Result 4');
      expect(postItems[4].querySelector('.post-title').textContent).toBe('Search Result 5');
    });

    it('should display and preserve search header when items are loaded', async () => {
      // Mock all data sources
      mockFetch.mockImplementation((url) => {
        if (url.includes('media-releases')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              data: [
                { title: 'Test Item 1', description: 'Test description 1', path: '/test1' },
                { title: 'Test Item 2', description: 'Test description 2', path: '/test2' },
              ],
            }),
          });
        }
        if (url.includes('speeches')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              data: [],
            }),
          });
        }
        if (url.includes('qantas-responds')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              data: [],
            }),
          });
        }
        if (url.includes('roo-tales')) {
          return Promise.resolve({
            json: () => Promise.resolve({
              data: [],
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const block = document.querySelector('div');
      block.classList.add('search');
      // Mock URL parameters
      const url = new URL(window.location.href);
      url.searchParams.set('q', 'test');
      window.history.pushState({}, '', url);
      await decorate(block);
      // Verify search header exists
      const searchHeader = block.querySelector('.search-results-header');
      expect(searchHeader).not.toBeNull();

      // Verify search header content
      const headerTitle = searchHeader.querySelector('h2');
      const headerCount = searchHeader.querySelector('p');
      expect(headerTitle.textContent).toBe('Search results for "test"');
      expect(headerCount.textContent).toBe('2 results found');

      // Verify header is preserved after items are loaded
      const postItems = block.querySelectorAll('.post-item');
      expect(postItems.length).toBe(2);
      expect(block.querySelector('.search-results-header')).not.toBeNull();
    });

    it('should handle errors gracefully', async () => {
      // Mock fetch to throw error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const block = document.querySelector('div');
      await decorate(block);

      expect(block.innerHTML).toContain('An error occurred while loading the content');
    });
  });

  describe('Block Structure', () => {
    it('should create pagination when needed', async () => {
      // Mock fetch with enough items to trigger pagination
      const mockData = Array(15).fill(null).map((_, index) => ({
        title: `Test ${index + 1}`,
        publisheddate: '2023-01-01',
        description: `Test description ${index + 1}`,
        path: `/test${index + 1}`,
        publishedlocation: 'Sydney',
      }));

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          data: mockData,
          total: 15,
        }),
      });
      const block = document.querySelector('div');
      await decorate(block);
      // Verify pagination
      const pagination = block.querySelector('.pagination');
      expect(pagination).toBeTruthy();
      const pageLinks = pagination.querySelectorAll('.page-link');
      expect(pageLinks.length).toBeGreaterThan(0);
      expect(pageLinks[0].classList.contains('current')).toBe(true);
    });

    it('should not create pagination on home page', async () => {
      // Update URL to home page
      const url = new URL(window.location.href);
      url.pathname = '/';
      window.history.pushState({}, '', url);
      // Mock fetch with enough items to trigger pagination
      const mockData = Array(15).fill(null).map((_, index) => ({
        title: `Test ${index + 1}`,
        publisheddate: '2023-01-01',
        description: `Test description ${index + 1}`,
        path: `/test${index + 1}`,
        publishedlocation: 'Sydney',
      }));
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          data: mockData,
          total: 15,
        }),
      });

      const block = document.querySelector('div');
      await decorate(block);

      // Verify no pagination on home page
      const pagination = block.querySelector('.pagination');
      expect(pagination).toBeFalsy();
    });

    it('should create post items with correct structure', async () => {
      // Mock fetch with sample post data
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          data: [{
            title: 'Test Post',
            path: '/test',
            publisheddate: '2023-01-01',
            description: 'Test description',
            publishedlocation: 'Sydney',
            image: 'test.jpg',
          }],
          total: 1,
        }),
      });

      const block = document.querySelector('div');
      await decorate(block);

      const postItem = block.querySelector('.post-item');
      expect(postItem).toBeTruthy();

      // Verify post item structure
      expect(postItem.querySelector('.post-title')).toBeTruthy();
      expect(postItem.querySelector('.post-meta')).toBeTruthy();
      expect(postItem.querySelector('.post-excerpt')).toBeTruthy();
      expect(postItem.querySelector('.read-more')).toBeTruthy();

      // Verify content
      expect(postItem.querySelector('.post-title').textContent).toBe('Test Post');
      expect(postItem.querySelector('.post-meta').textContent).toContain('formatted: 2023-01-01');
      expect(postItem.querySelector('.post-meta').textContent).toContain('Sydney');
      expect(postItem.querySelector('.post-excerpt').textContent).toContain('Test description');
    });

    it('should show no results message when no items are found', async () => {
      // Mock fetch with empty data
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          data: [],
          total: 0,
        }),
      });

      const block = document.querySelector('div');
      await decorate(block);

      const noResults = block.querySelector('.no-results');
      expect(noResults).toBeTruthy();
      expect(noResults.querySelector('h3').textContent).toBe('No results found');
      expect(noResults.querySelector('p').textContent).toContain('Your search did not match any documents');
    });
  });
});
