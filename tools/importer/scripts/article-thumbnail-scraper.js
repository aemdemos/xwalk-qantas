// Description: Scraper for Qantas Newsroom articles and associated thumbnail images
// HOW TO RUN:
//  1. npm install axios cheerio - to install the required dependencies
//  2. node article-thumbnail-scraper.js - to run the scraper

/* eslint-disable no-console, import/no-unresolved */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { setTimeout } = require('timers/promises');

// Configuration
const config = {
  urls: [
    // Media Releases
    'https://www.qantasnewsroom.com.au/media-releases/',
    'https://www.qantasnewsroom.com.au/media-releases/page/2/',
    'https://www.qantasnewsroom.com.au/media-releases/page/3/',
    'https://www.qantasnewsroom.com.au/media-releases/page/4/',
    'https://www.qantasnewsroom.com.au/media-releases/page/5/',
    'https://www.qantasnewsroom.com.au/media-releases/page/6/',
    'https://www.qantasnewsroom.com.au/media-releases/page/7/',
    'https://www.qantasnewsroom.com.au/media-releases/page/8/',
    'https://www.qantasnewsroom.com.au/media-releases/page/9/',
    'https://www.qantasnewsroom.com.au/media-releases/page/10/',
    'https://www.qantasnewsroom.com.au/media-releases/page/11/',
    'https://www.qantasnewsroom.com.au/media-releases/page/12/',
    'https://www.qantasnewsroom.com.au/media-releases/page/13/',
    'https://www.qantasnewsroom.com.au/media-releases/page/14/',
    'https://www.qantasnewsroom.com.au/media-releases/page/15/',
    'https://www.qantasnewsroom.com.au/media-releases/page/16/',
    'https://www.qantasnewsroom.com.au/media-releases/page/17/',
    'https://www.qantasnewsroom.com.au/media-releases/page/18/',
    'https://www.qantasnewsroom.com.au/media-releases/page/19/',
    'https://www.qantasnewsroom.com.au/media-releases/page/20/',
    'https://www.qantasnewsroom.com.au/media-releases/page/21/',
    'https://www.qantasnewsroom.com.au/media-releases/page/22/',
    'https://www.qantasnewsroom.com.au/media-releases/page/23/',
    'https://www.qantasnewsroom.com.au/media-releases/page/24/',
    'https://www.qantasnewsroom.com.au/media-releases/page/25/',
    'https://www.qantasnewsroom.com.au/media-releases/page/26/',
    'https://www.qantasnewsroom.com.au/media-releases/page/27/',
    'https://www.qantasnewsroom.com.au/media-releases/page/28/',
    'https://www.qantasnewsroom.com.au/media-releases/page/29/',
    'https://www.qantasnewsroom.com.au/media-releases/page/30/',
    'https://www.qantasnewsroom.com.au/media-releases/page/31/',
    'https://www.qantasnewsroom.com.au/media-releases/page/32/',
    'https://www.qantasnewsroom.com.au/media-releases/page/33/',
    'https://www.qantasnewsroom.com.au/media-releases/page/34/',
    'https://www.qantasnewsroom.com.au/media-releases/page/35/',
    'https://www.qantasnewsroom.com.au/media-releases/page/36/',
    'https://www.qantasnewsroom.com.au/media-releases/page/37/',
    'https://www.qantasnewsroom.com.au/media-releases/page/38/',
    'https://www.qantasnewsroom.com.au/media-releases/page/39/',
    'https://www.qantasnewsroom.com.au/media-releases/page/40/',
    'https://www.qantasnewsroom.com.au/media-releases/page/41/',
    'https://www.qantasnewsroom.com.au/media-releases/page/42/',
    'https://www.qantasnewsroom.com.au/media-releases/page/43/',
    'https://www.qantasnewsroom.com.au/media-releases/page/44/',
    'https://www.qantasnewsroom.com.au/media-releases/page/45/',
    'https://www.qantasnewsroom.com.au/media-releases/page/46/',
    'https://www.qantasnewsroom.com.au/media-releases/page/47/',
    'https://www.qantasnewsroom.com.au/media-releases/page/48/',
    'https://www.qantasnewsroom.com.au/media-releases/page/49/',
    'https://www.qantasnewsroom.com.au/media-releases/page/50/',
    'https://www.qantasnewsroom.com.au/media-releases/page/51/',
    'https://www.qantasnewsroom.com.au/media-releases/page/52/',
    'https://www.qantasnewsroom.com.au/media-releases/page/53/',
    'https://www.qantasnewsroom.com.au/media-releases/page/54/',
    'https://www.qantasnewsroom.com.au/media-releases/page/55/',
    'https://www.qantasnewsroom.com.au/media-releases/page/56/',
    'https://www.qantasnewsroom.com.au/media-releases/page/57/',
    'https://www.qantasnewsroom.com.au/media-releases/page/58/',
    'https://www.qantasnewsroom.com.au/media-releases/page/59/',
    'https://www.qantasnewsroom.com.au/media-releases/page/60/',
    'https://www.qantasnewsroom.com.au/media-releases/page/61/',
    'https://www.qantasnewsroom.com.au/media-releases/page/62/',
    'https://www.qantasnewsroom.com.au/media-releases/page/63/',
    'https://www.qantasnewsroom.com.au/media-releases/page/64/',
    'https://www.qantasnewsroom.com.au/media-releases/page/65/',
    'https://www.qantasnewsroom.com.au/media-releases/page/66/',
    'https://www.qantasnewsroom.com.au/media-releases/page/67/',
    'https://www.qantasnewsroom.com.au/media-releases/page/68/',
    'https://www.qantasnewsroom.com.au/media-releases/page/69/',
    'https://www.qantasnewsroom.com.au/media-releases/page/70/',
    'https://www.qantasnewsroom.com.au/media-releases/page/71/',
    'https://www.qantasnewsroom.com.au/media-releases/page/72/',
    'https://www.qantasnewsroom.com.au/media-releases/page/73/',
    'https://www.qantasnewsroom.com.au/media-releases/page/74/',
    'https://www.qantasnewsroom.com.au/media-releases/page/75/',
    'https://www.qantasnewsroom.com.au/media-releases/page/76/',
    'https://www.qantasnewsroom.com.au/media-releases/page/77/',
    'https://www.qantasnewsroom.com.au/media-releases/page/78/',
    'https://www.qantasnewsroom.com.au/media-releases/page/79/',
    'https://www.qantasnewsroom.com.au/media-releases/page/80/',
    'https://www.qantasnewsroom.com.au/media-releases/page/81/',
    'https://www.qantasnewsroom.com.au/media-releases/page/82/',
    'https://www.qantasnewsroom.com.au/media-releases/page/83/',
    'https://www.qantasnewsroom.com.au/media-releases/page/84/',
    'https://www.qantasnewsroom.com.au/media-releases/page/85/',
    'https://www.qantasnewsroom.com.au/media-releases/page/86/',
    'https://www.qantasnewsroom.com.au/media-releases/page/87/',
    'https://www.qantasnewsroom.com.au/media-releases/page/88/',
    'https://www.qantasnewsroom.com.au/media-releases/page/89/',
    'https://www.qantasnewsroom.com.au/media-releases/page/90/',
    'https://www.qantasnewsroom.com.au/media-releases/page/91/',
    'https://www.qantasnewsroom.com.au/media-releases/page/92/',
    'https://www.qantasnewsroom.com.au/media-releases/page/93/',
    'https://www.qantasnewsroom.com.au/media-releases/page/94/',
    'https://www.qantasnewsroom.com.au/media-releases/page/95/',
    'https://www.qantasnewsroom.com.au/media-releases/page/96/',
    'https://www.qantasnewsroom.com.au/media-releases/page/97/',
    'https://www.qantasnewsroom.com.au/media-releases/page/98/',
    'https://www.qantasnewsroom.com.au/media-releases/page/99/',
    'https://www.qantasnewsroom.com.au/media-releases/page/100/',
    'https://www.qantasnewsroom.com.au/media-releases/page/101/',
    'https://www.qantasnewsroom.com.au/media-releases/page/102/',
    'https://www.qantasnewsroom.com.au/media-releases/page/103/',
    'https://www.qantasnewsroom.com.au/media-releases/page/104/',
    'https://www.qantasnewsroom.com.au/media-releases/page/105/',
    'https://www.qantasnewsroom.com.au/media-releases/page/106/',
    'https://www.qantasnewsroom.com.au/media-releases/page/107/',
    'https://www.qantasnewsroom.com.au/media-releases/page/108/',
    'https://www.qantasnewsroom.com.au/media-releases/page/109/',
    'https://www.qantasnewsroom.com.au/media-releases/page/110/',
    'https://www.qantasnewsroom.com.au/media-releases/page/111/',
    'https://www.qantasnewsroom.com.au/media-releases/page/112/',
    'https://www.qantasnewsroom.com.au/media-releases/page/113/',
    'https://www.qantasnewsroom.com.au/media-releases/page/114/',
    'https://www.qantasnewsroom.com.au/media-releases/page/115/',
    'https://www.qantasnewsroom.com.au/media-releases/page/116/',
    'https://www.qantasnewsroom.com.au/media-releases/page/117/',
    'https://www.qantasnewsroom.com.au/media-releases/page/118/',
    'https://www.qantasnewsroom.com.au/media-releases/page/119/',
    'https://www.qantasnewsroom.com.au/media-releases/page/120/',
    'https://www.qantasnewsroom.com.au/media-releases/page/121/',
    'https://www.qantasnewsroom.com.au/media-releases/page/122/',
    'https://www.qantasnewsroom.com.au/media-releases/page/123/',
    'https://www.qantasnewsroom.com.au/media-releases/page/124/',
    'https://www.qantasnewsroom.com.au/media-releases/page/125/',
    'https://www.qantasnewsroom.com.au/media-releases/page/126/',
    'https://www.qantasnewsroom.com.au/media-releases/page/127/',
    'https://www.qantasnewsroom.com.au/media-releases/page/128/',
    'https://www.qantasnewsroom.com.au/media-releases/page/129/',
    'https://www.qantasnewsroom.com.au/media-releases/page/130/',
    'https://www.qantasnewsroom.com.au/media-releases/page/131/',
    'https://www.qantasnewsroom.com.au/media-releases/page/132/',
    'https://www.qantasnewsroom.com.au/media-releases/page/133/',
    'https://www.qantasnewsroom.com.au/media-releases/page/134/',
    'https://www.qantasnewsroom.com.au/media-releases/page/135/',
    'https://www.qantasnewsroom.com.au/media-releases/page/136/',
    'https://www.qantasnewsroom.com.au/media-releases/page/137/',
    'https://www.qantasnewsroom.com.au/media-releases/page/138/',
    'https://www.qantasnewsroom.com.au/media-releases/page/139/',
    'https://www.qantasnewsroom.com.au/media-releases/page/140/',
    'https://www.qantasnewsroom.com.au/media-releases/page/141/',
    'https://www.qantasnewsroom.com.au/media-releases/page/142/',
    'https://www.qantasnewsroom.com.au/media-releases/page/143/',
    'https://www.qantasnewsroom.com.au/media-releases/page/144/',
    'https://www.qantasnewsroom.com.au/media-releases/page/145/',
    'https://www.qantasnewsroom.com.au/media-releases/page/146/',
    'https://www.qantasnewsroom.com.au/media-releases/page/147/',
    'https://www.qantasnewsroom.com.au/media-releases/page/148/',
    'https://www.qantasnewsroom.com.au/media-releases/page/149/',
    'https://www.qantasnewsroom.com.au/media-releases/page/150/',
    'https://www.qantasnewsroom.com.au/media-releases/page/151/',
    'https://www.qantasnewsroom.com.au/media-releases/page/152/',
    'https://www.qantasnewsroom.com.au/media-releases/page/153/',
    'https://www.qantasnewsroom.com.au/media-releases/page/154/',
    'https://www.qantasnewsroom.com.au/media-releases/page/155/',
    'https://www.qantasnewsroom.com.au/media-releases/page/156/',
    'https://www.qantasnewsroom.com.au/media-releases/page/157/',
    'https://www.qantasnewsroom.com.au/media-releases/page/158/',
    'https://www.qantasnewsroom.com.au/media-releases/page/159/',
    'https://www.qantasnewsroom.com.au/media-releases/page/160/',
    'https://www.qantasnewsroom.com.au/media-releases/page/161/',
    'https://www.qantasnewsroom.com.au/media-releases/page/162/',
    'https://www.qantasnewsroom.com.au/media-releases/page/163/',
    'https://www.qantasnewsroom.com.au/media-releases/page/164/',
    'https://www.qantasnewsroom.com.au/media-releases/page/165/',
    'https://www.qantasnewsroom.com.au/media-releases/page/166/',
    'https://www.qantasnewsroom.com.au/media-releases/page/167/',
    'https://www.qantasnewsroom.com.au/media-releases/page/168/',
    'https://www.qantasnewsroom.com.au/media-releases/page/169/',
    'https://www.qantasnewsroom.com.au/media-releases/page/170/',
    'https://www.qantasnewsroom.com.au/media-releases/page/171/',
    'https://www.qantasnewsroom.com.au/media-releases/page/172/',
    'https://www.qantasnewsroom.com.au/media-releases/page/173/',
    'https://www.qantasnewsroom.com.au/media-releases/page/174/',
    'https://www.qantasnewsroom.com.au/media-releases/page/175/',
    'https://www.qantasnewsroom.com.au/media-releases/page/176/',
    'https://www.qantasnewsroom.com.au/media-releases/page/177/',
    'https://www.qantasnewsroom.com.au/media-releases/page/178/',
    'https://www.qantasnewsroom.com.au/media-releases/page/179/',
    'https://www.qantasnewsroom.com.au/media-releases/page/180/',
    'https://www.qantasnewsroom.com.au/media-releases/page/181/',
    'https://www.qantasnewsroom.com.au/media-releases/page/182/',
    'https://www.qantasnewsroom.com.au/media-releases/page/183/',
    'https://www.qantasnewsroom.com.au/media-releases/page/184/',
    'https://www.qantasnewsroom.com.au/media-releases/page/185/',
    'https://www.qantasnewsroom.com.au/media-releases/page/186/',
    'https://www.qantasnewsroom.com.au/media-releases/page/187/',
    'https://www.qantasnewsroom.com.au/media-releases/page/188/',
    'https://www.qantasnewsroom.com.au/media-releases/page/189/',
    'https://www.qantasnewsroom.com.au/media-releases/page/190/',
    'https://www.qantasnewsroom.com.au/media-releases/page/191/',
    'https://www.qantasnewsroom.com.au/media-releases/page/192/',
    'https://www.qantasnewsroom.com.au/media-releases/page/193/',
    'https://www.qantasnewsroom.com.au/media-releases/page/194/',
    'https://www.qantasnewsroom.com.au/media-releases/page/195/',
    'https://www.qantasnewsroom.com.au/media-releases/page/196/',
    'https://www.qantasnewsroom.com.au/media-releases/page/197/',
    'https://www.qantasnewsroom.com.au/media-releases/page/198/',
    'https://www.qantasnewsroom.com.au/media-releases/page/199/',
    'https://www.qantasnewsroom.com.au/media-releases/page/200/',
    'https://www.qantasnewsroom.com.au/media-releases/page/201/',
    'https://www.qantasnewsroom.com.au/media-releases/page/202/',
    'https://www.qantasnewsroom.com.au/media-releases/page/203/',
    'https://www.qantasnewsroom.com.au/media-releases/page/204/',
    'https://www.qantasnewsroom.com.au/media-releases/page/205/',
    'https://www.qantasnewsroom.com.au/media-releases/page/206/',
    'https://www.qantasnewsroom.com.au/media-releases/page/207/',
    'https://www.qantasnewsroom.com.au/media-releases/page/208/',
    'https://www.qantasnewsroom.com.au/media-releases/page/209/',
    'https://www.qantasnewsroom.com.au/media-releases/page/210/',
    'https://www.qantasnewsroom.com.au/media-releases/page/211/',
    'https://www.qantasnewsroom.com.au/media-releases/page/212/',
    'https://www.qantasnewsroom.com.au/media-releases/page/213/',
    'https://www.qantasnewsroom.com.au/media-releases/page/214/',
    'https://www.qantasnewsroom.com.au/media-releases/page/215/',
    'https://www.qantasnewsroom.com.au/media-releases/page/216/',
    'https://www.qantasnewsroom.com.au/media-releases/page/217/',
    'https://www.qantasnewsroom.com.au/media-releases/page/218/',
    'https://www.qantasnewsroom.com.au/media-releases/page/219/',
    'https://www.qantasnewsroom.com.au/media-releases/page/220/',
    'https://www.qantasnewsroom.com.au/media-releases/page/221/',
    'https://www.qantasnewsroom.com.au/media-releases/page/222/',
    'https://www.qantasnewsroom.com.au/media-releases/page/223/',
    'https://www.qantasnewsroom.com.au/media-releases/page/224/',
    'https://www.qantasnewsroom.com.au/media-releases/page/225/',
    'https://www.qantasnewsroom.com.au/media-releases/page/226/',
    'https://www.qantasnewsroom.com.au/media-releases/page/227/',
    'https://www.qantasnewsroom.com.au/media-releases/page/228/',
    'https://www.qantasnewsroom.com.au/media-releases/page/229/',
    'https://www.qantasnewsroom.com.au/media-releases/page/230/',
    'https://www.qantasnewsroom.com.au/media-releases/page/231/',
    'https://www.qantasnewsroom.com.au/media-releases/page/232/',
    'https://www.qantasnewsroom.com.au/media-releases/page/233/',
    'https://www.qantasnewsroom.com.au/media-releases/page/234/',
    'https://www.qantasnewsroom.com.au/media-releases/page/235/',
    'https://www.qantasnewsroom.com.au/media-releases/page/236/',
    'https://www.qantasnewsroom.com.au/media-releases/page/237/',
    'https://www.qantasnewsroom.com.au/media-releases/page/238/',
    'https://www.qantasnewsroom.com.au/media-releases/page/239/',
    'https://www.qantasnewsroom.com.au/media-releases/page/240/',
    'https://www.qantasnewsroom.com.au/media-releases/page/241/',
    'https://www.qantasnewsroom.com.au/media-releases/page/242/',
    'https://www.qantasnewsroom.com.au/media-releases/page/243/',
    'https://www.qantasnewsroom.com.au/media-releases/page/244/',
    'https://www.qantasnewsroom.com.au/media-releases/page/245/',
    'https://www.qantasnewsroom.com.au/media-releases/page/246/',
    'https://www.qantasnewsroom.com.au/media-releases/page/247/',
    'https://www.qantasnewsroom.com.au/media-releases/page/248/',
    // Speeches
    'https://www.qantasnewsroom.com.au/speeches/',
    'https://www.qantasnewsroom.com.au/speeches/page/2/',
    'https://www.qantasnewsroom.com.au/speeches/page/3/',
    'https://www.qantasnewsroom.com.au/speeches/page/4/',
    'https://www.qantasnewsroom.com.au/speeches/page/5/',
    'https://www.qantasnewsroom.com.au/speeches/page/6/',
    'https://www.qantasnewsroom.com.au/speeches/page/7/',
    'https://www.qantasnewsroom.com.au/speeches/page/8/',
    'https://www.qantasnewsroom.com.au/speeches/page/9/',
    'https://www.qantasnewsroom.com.au/speeches/page/10/',
    'https://www.qantasnewsroom.com.au/speeches/page/11/',
    'https://www.qantasnewsroom.com.au/speeches/page/12/',
    'https://www.qantasnewsroom.com.au/speeches/page/13/',
    'https://www.qantasnewsroom.com.au/speeches/page/14/',
    'https://www.qantasnewsroom.com.au/speeches/page/15/',
    'https://www.qantasnewsroom.com.au/speeches/page/16/',
    'https://www.qantasnewsroom.com.au/speeches/page/17/',
    'https://www.qantasnewsroom.com.au/speeches/page/18/',
    'https://www.qantasnewsroom.com.au/speeches/page/19/',
    // Add more to the list of URLs here if required
  ],

  // Selectors - modify these to match the page's structure
  selectors: {
    article: '.posts-module .post-has-image',
    href: '.post-image',
    image: '.post-image img',
  },

  // Rate limiting and retry settings
  rateLimit: {
    delay: 1000, // Delay between requests in milliseconds
    maxRetries: 3, // Maximum number of retries for failed requests
    retryDelay: 2000, // Delay between retries in milliseconds
  },
};

class ArticleScraper {
  // eslint-disable-next-line no-shadow
  constructor(config) {
    this.config = config;
    this.articleMap = {}; // To store article-image pairs
  }

  /**
   * Fetch the HTML content of a URL with retry logic
   * @param {string} url
   * @param {number} retryCount
   * @returns {Promise<string>} The HTML content of the URL
   */
  async fetchWithRetry(url, retryCount = 0) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 30000, // Increased to 30 seconds
      });
      return response.data;
    } catch (error) {
      if (retryCount < this.config.rateLimit.maxRetries) {
        const delay = this.config.rateLimit.retryDelay * (retryCount + 1); // Exponential backoff
        console.warn(`Retrying ${url} (attempt ${retryCount + 1}/${this.config.rateLimit.maxRetries}) after ${delay}ms delay`);
        console.warn(`Error: ${error.message}`);
        await setTimeout(delay);
        return this.fetchWithRetry(url, retryCount + 1);
      }
      console.error(`Failed to fetch ${url} after ${this.config.rateLimit.maxRetries} attempts:`, error.message);
      throw error;
    }
  }

  /**
   * Scrape the articles from a given URL
   * @param {string} url
   * @returns {Promise<boolean>} True if scraping was successful, false otherwise
   */
  async scrapeArticlesFromUrl(url) {
    try {
      console.info(`\n=== Scraping: ${url} ===`);
      const html = await this.fetchWithRetry(url);
      const $ = cheerio.load(html);

      // Log the number of elements matching the article selector
      const articleElements = $(this.config.selectors.article);
      console.info(`Found ${articleElements.length} elements matching selector: ${this.config.selectors.article}`);

      $(this.config.selectors.article).each((_, element) => {
        // Get the href and image src from the article image element
        const href = $(element).find(this.config.selectors.href).attr('href');
        const img = $(element).find(this.config.selectors.image).attr('src');

        console.info('\nProcessing article element:');
        console.info(`- Href found: ${href}`);
        console.info(`- Image found: ${img}`);

        if (href && img) {
          // Add to the flat map
          this.articleMap[href] = img;
          console.info(`- Added image to map for url: ${href}`);
        }
      });

      return true;
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error.message);
      return false;
    }
  }

  /**
   * Scrape all the articles from the list of URLs
   * @returns {Promise<boolean>} True if scraping was successful, false otherwise
   */
  async scrapeAll() {
    const results = await Promise.all(
      this.config.urls.map(async (url) => {
        const result = await this.scrapeArticlesFromUrl(url);
        await setTimeout(this.config.rateLimit.delay); // Rate limiting
        return result;
      }),
    );
    return results.every(Boolean);
  }

  /**
   * Save the results to a JSON file
   * @param {string} filename - The filename to save the results to
   */
  saveResults(filename = 'article_thumbnail_map.json') {
    fs.writeFileSync(filename, JSON.stringify(this.articleMap, null, 2));
    console.info(`✅ Scraping complete. Found ${Object.keys(this.articleMap).length} articles. Data saved to ${filename}`);
  }
}

// Main execution
(async () => {
  const scraper = new ArticleScraper(config);
  await scraper.scrapeAll();
  scraper.saveResults();
})();
