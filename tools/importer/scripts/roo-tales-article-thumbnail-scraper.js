// Description: AJAX-based scraper for Qantas Newsroom roo tales articles metadata
// and associated thumbnail images

/* eslint-disable no-console, import/no-unresolved */

const axios = require('axios');
const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const FormData = require('form-data');
const { setTimeout } = require('timers/promises');

// Configuration
const config = {
  // AJAX endpoint
  ajaxUrl: 'https://www.qantasnewsroom.com.au/wp-admin/admin-ajax.php',

  // Base URL for constructing article URLs
  baseUrl: 'https://www.qantasnewsroom.com.au/roo-tales/',

  // Page range to scrape
  pageRange: {
    start: 1,
    end: 19,
  },

  // Headers for the request
  headers: {
    accept: 'application/json, text/javascript, */*',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },

  // Form data template
  formData: {
    action: 'wp_loadmore',
    // page_no will be set dynamically
  },

  // Rate limiting and retry settings
  rateLimit: {
    delay: 1000, // Delay between requests in milliseconds
    maxRetries: 3, // Maximum number of retries for failed requests
    retryDelay: 2000, // Delay between retries in milliseconds
  },
};

class RooTalesArticleThumbnailScraper {
  // eslint-disable-next-line no-shadow
  constructor(config) {
    this.config = config;
    this.articleMap = {}; // To store article-image pairs
    this.processedUrls = new Set(); // To avoid duplicates
  }

  /**
   * Create form data for the POST request
   * @param {number} pageNo
   * @returns {FormData}
   */
  createFormData(pageNo) {
    const formData = new FormData();
    formData.append('action', this.config.formData.action);
    formData.append('page_no', pageNo.toString());
    return formData;
  }

  /**
   * Fetch JSON data from AJAX endpoint with retry logic
   * @param {number} pageNo
   * @param {number} retryCount
   * @returns {Promise<Array>} The response data as JSON array
   */
  async fetchWithRetry(pageNo, retryCount = 0) {
    try {
      const formData = this.createFormData(pageNo);

      const response = await axios.post(this.config.ajaxUrl, formData, {
        headers: {
          ...this.config.headers,
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 seconds timeout
      });

      // Response should be JSON array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      console.warn(`Unexpected response format for page ${pageNo}:`, typeof response.data);
      return [];
    } catch (error) {
      if (retryCount < this.config.rateLimit.maxRetries) {
        const delay = this.config.rateLimit.retryDelay * (retryCount + 1);
        const attempt = retryCount + 1;
        const { maxRetries } = this.config.rateLimit;
        console.warn(`Retrying page ${pageNo} (attempt ${attempt}/${maxRetries}) after ${delay}ms delay`);
        console.warn(`Error: ${error.message}`);
        await setTimeout(delay);
        return this.fetchWithRetry(pageNo, retryCount + 1);
      }
      const { maxRetries } = this.config.rateLimit;
      console.error(`Failed to fetch page ${pageNo} after ${maxRetries} attempts:`, error.message);
      throw error;
    }
  }

  /**
   * Construct article URL from slug
   * @param {string} slug
   * @returns {string}
   */
  makeArticleUrl(slug) {
    if (!slug) return '';
    return `${this.config.baseUrl}${slug}/`;
  }

  /**
   * Process articles from a JSON response
   * @param {number} pageNo
   * @returns {Promise<boolean>} True if processing was successful
   */
  async scrapeArticlesFromPage(pageNo) {
    try {
      console.info(`\n=== Scraping page: ${pageNo} ===`);
      const articles = await this.fetchWithRetry(pageNo);

      if (!articles || articles.length === 0) {
        console.warn(`No articles found on page ${pageNo}`);
        return true; // Not an error, just empty page
      }

      console.info(`Found ${articles.length} articles on page ${pageNo}`);

      // Process each article from the JSON response
      articles.forEach((article, index) => {
        const {
          id,
          title,
          slug,
          thumbnail,
        } = article;

        console.info(`\nProcessing article ${index + 1}/${articles.length}:`);
        console.info(`- ID: ${id}`);
        console.info(`- Title: ${title}`);
        console.info(`- Slug: ${slug}`);
        console.info(`- Thumbnail: ${thumbnail}`);

        if (slug && thumbnail) {
          const articleUrl = this.makeArticleUrl(slug);

          // Avoid duplicates
          if (!this.processedUrls.has(articleUrl)) {
            this.articleMap[articleUrl] = thumbnail;
            this.processedUrls.add(articleUrl);
            console.info(`- Added to map: ${articleUrl}`);
          } else {
            console.info(`- Skipped duplicate: ${articleUrl}`);
          }
        } else {
          console.warn('- Skipped article due to missing slug or thumbnail');
        }
      });

      return true;
    } catch (error) {
      console.error(`Failed to process page ${pageNo}:`, error.message);
      return false;
    }
  }

  /**
   * Scrape all pages in the configured range
   * @returns {Promise<boolean>} True if scraping was successful
   */
  async scrapeAll() {
    console.info(`Starting to scrape pages ${this.config.pageRange.start} to ${this.config.pageRange.end}`);

    const results = [];

    // eslint-disable-next-line max-len
    for (let pageNo = this.config.pageRange.start; pageNo <= this.config.pageRange.end; pageNo += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await this.scrapeArticlesFromPage(pageNo);
        results.push(result);

        // Rate limiting between requests
        if (pageNo < this.config.pageRange.end) {
          // eslint-disable-next-line no-await-in-loop
          await setTimeout(this.config.rateLimit.delay);
        }
      } catch (error) {
        console.error(`Error scraping page ${pageNo}:`, error.message);
        results.push(false);
      }
    }

    return results.some(Boolean); // Return true if at least one page was successful
  }

  /**
   * Save the results to a JSON file
   * @param {string} filename - The filename to save the results to
   */
  saveResults(filename = 'roo_tales_article_thumbnail_map.json') {
    const sortedArticleMap = {};
    Object.keys(this.articleMap)
      .sort()
      .forEach((key) => {
        sortedArticleMap[key] = this.articleMap[key];
      });

    fs.writeFileSync(filename, JSON.stringify(sortedArticleMap, null, 2));
    const articleCount = Object.keys(this.articleMap).length;
    console.info(`✅ Scraping complete. Found ${articleCount} unique articles. Data saved to ${filename}`);
  }
}

// Main execution
(async () => {
  try {
    const scraper = new RooTalesArticleThumbnailScraper(config);
    const success = await scraper.scrapeAll();

    if (success) {
      scraper.saveResults();
    } else {
      console.error('❌ Scraping failed completely');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
})();
