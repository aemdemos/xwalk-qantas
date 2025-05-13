/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */

// Convert text date in the format 'Published on 28th October 2015 at 9:17' to ISO format
function convertToISO(dateString) {
  const regex = /(Published|Posted) on (\d{1,2})(?:st|nd|rd|th)? (\w+) (\d{4})(?: at (\d{1,2}):(\d{2}))?/;
  const match = dateString.match(regex);

  if (!match) {
    return null;
  }

  const [, , day, month, year, hours, minutes] = match;

  const monthMap = {
    January: '01',
    February: '02',
    March: '03',
    April: '04',
    May: '05',
    June: '06',
    July: '07',
    August: '08',
    September: '09',
    October: '10',
    November: '11',
    December: '12',
  };

  const monthNumber = monthMap[month];

  if (!monthNumber) {
    return null;
  }

  const formattedHours = hours ? hours.padStart(2, '0') : '00';
  const formattedMinutes = minutes ? minutes.padStart(2, '0') : '00';

  return `${year}-${monthNumber}-${day.padStart(2, '0')}T${formattedHours}:${formattedMinutes}:00.00`;
}

let articleThumbnailMap = null;

function fetchArticleThumbnailMap() {
  if (articleThumbnailMap) return articleThumbnailMap;

  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://localhost:3001/tools/importer/article_thumbnail_map.json', false);
    xhr.send();

    if (xhr.status === 200) {
      articleThumbnailMap = JSON.parse(xhr.responseText);
      return articleThumbnailMap;
    }
    throw new Error(`HTTP error! status: ${xhr.status}`);
  } catch (error) {
    console.error('Error fetching article thumbnail map:', error);
    return {};
  }
}

function getArticleThumbnail(url) {
  const { pathname } = new URL(url);
  const lookupUrl = `https://www.qantasnewsroom.com.au${pathname}`;
  const map = fetchArticleThumbnailMap();
  return map[lookupUrl] || null;
}

function setPageMetadataImage(meta, document, url) {
  if ('Image' in meta) {
    delete meta.Image;
    const img = document.createElement('img');

    const thumbnailUrl = getArticleThumbnail(url);
    if (thumbnailUrl) {
      img.src = thumbnailUrl;
    } else if (url.includes('/gallery/') && document.querySelector('.full-width')) {
      img.src = document.querySelector('.full-width img')?.getAttribute('src');
    } else {
      img.src = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    }
    meta.image = img;
  }
}

// for article, add the published date and intro to the page metadata
function addPageIntroAndPublishedMetadata(document, meta) {
  const pageContent = document.querySelector('.page-content')?.innerText.trim();
  let intro;
  if (pageContent && pageContent.length > 400) {
    let trimmedContent = pageContent.slice(0, 400);
    // Ensure we don't cut off in the middle of a word
    const lastSpaceIndex = trimmedContent.lastIndexOf(' ');
    if (lastSpaceIndex > 0) {
      trimmedContent = trimmedContent.slice(0, lastSpaceIndex);
    }

    intro = `${trimmedContent} […]`; // Append the indicator for more content
  } else {
    intro = pageContent;
  }
  meta.intro = intro || '';
  const pageIntro = document.querySelector('.page-intro');
  if (pageIntro) {
    const publishedDateStr = pageIntro.querySelector('.page-published-date')?.innerText.trim() || '';
    meta.publishedDate = convertToISO(publishedDateStr) || '';
    meta.publishedLocation = pageIntro.querySelector('.page-published-location')?.innerText.trim() || '';
  }
}

function addSidebarInfoToMetadata(document, meta) {
  const sidebarIntro = document.querySelector('.sidebar-intro');
  // add the sidebar metadata for gallery-template-default page
  if (sidebarIntro && document.querySelector('.gallery-template-default')) {
    const paragraphs = sidebarIntro.querySelectorAll('p');
    meta.imageCount = paragraphs[0]?.textContent.trim() || '';
    meta.publishedDate = convertToISO(paragraphs[1]?.textContent.trim()) || '';
  }

  // add the topics (if present) for /media-releases/<articles>
  if (document.querySelector('.sidebar-topics')) {
    const topics = [];
    document.querySelectorAll('.sidebar-topic').forEach((topic) => {
      const link = topic.querySelector('a');
      if (link) {
        topics.push(link.className);
      }
    });
    meta.pageTopics = topics.join(',');
  }
}

function setMetadata(meta, document, url) {
  delete meta['og:title'];
  delete meta['og:description'];
  delete meta.twitter;

  if ('Title' in meta) {
    meta['jcr:title'] = meta.Title;
    delete meta.Title;
  }
  if ('Description' in meta) {
    meta['jcr:description'] = meta.Description;
    delete meta.Description;
  }

  setPageMetadataImage(meta, document, url);
  addPageIntroAndPublishedMetadata(document, meta);
  addSidebarInfoToMetadata(document, meta);
}

function getGalleyCategoryCards(galleries) {
  const cells = [['Cards (teaser)']];
  galleries.forEach((gallery) => {
    let href = gallery.querySelector('.gallery-image')?.getAttribute('href') || '';
    href = href.replace(/\/$/, ''); // remove trailing slash (if any)
    const img = gallery.querySelector('.gallery-image img');
    const text = gallery.querySelector('.gallery-text');
    const title = text.querySelector('.title').innerText;
    const description = text.querySelector('.gallery-description')?.innerText;
    const formattedText = description ? `<p>${title}</p>\n<p>${description}</p>` : `<p>${title}</p>`;
    const cell = [img, formattedText, href];
    cells.push(cell);
  });
  return cells;
}

function innerGalleryCards(gallery) {
  const cells = [['Cards (banner)']];
  gallery.querySelectorAll('.swipebox').forEach((item) => {
    // default image
    const img = item.querySelector('img');
    // use higher resolution images if present
    const imgSrc = item.getAttribute('data-original') || img.getAttribute('href');
    if (imgSrc) {
      img.src = imgSrc;
    }
    cells.push([img]);
  });
  return cells;
}

function getGalleryCards(main) {
  const cells = [['Cards (thumbnail)']];
  main.querySelectorAll('.galleries-module ul li').forEach((item) => {
    let href = item.querySelector('.gallery-image')?.getAttribute('href');
    href = href.replace(/\/$/, ''); // remove trailing slash (if any)
    const img = item.querySelector('.gallery-image img');
    const meta = item.querySelector('.gallery-meta').innerText;
    const cell = [img, meta, href];
    cells.push(cell);
  });
  return cells;
}

function getTopicCards(topicsModule) {
  const cells = [['Topic Cards']];
  topicsModule.querySelectorAll('li').forEach((topic) => {
    const topicTitle = topic.querySelector('.topic-title')?.innerText;
    const backgroundImg = topic.querySelector('.topics-background');
    const overlayImg = topic.querySelector('.topic-overlay img');
    overlayImg.classList.replace('hide-ie', 'overylay-image');
    let href = topic.querySelector('.topic-overlay')?.getAttribute('href');
    href = href.replace(/\/$/, ''); // remove trailing slash (if any)
    const cell = [backgroundImg, overlayImg, href, topicTitle];
    cells.push(cell);
  });
  return cells;
}

function addCards(main) {
  const galleriesModule = main.querySelector('.galleries-module');
  if (galleriesModule) {
    let cells;
    const galleries = galleriesModule.querySelectorAll('.gallery');
    if (galleries && galleries.length > 0) {
      cells = getGalleyCategoryCards(galleries);
      main.querySelector('.pagination')?.remove();
    } else {
      cells = getGalleryCards(main);
    }
    const table = WebImporter.DOMUtils.createTable(cells, document);
    galleriesModule.replaceWith(table);
  } else {
    const topicsModule = main.querySelector('.topics-module');
    if (topicsModule) {
      const cells = getTopicCards(topicsModule);
      const table = WebImporter.DOMUtils.createTable(cells, document);
      topicsModule.replaceWith(table);
    }
  }
}

function addGalleryImages(main) {
  const fullWidthContainer = main.querySelector('.full-width');
  if (fullWidthContainer) {
    const gallery = main.querySelector('.gallery'); // eg. https://www.qantasnewsroom.com.au/gallery/singapore-first-lounge-concepts/
    if (gallery) {
      const cells = innerGalleryCards(gallery);
      const table = WebImporter.DOMUtils.createTable(cells, document);
      fullWidthContainer.replaceWith(table);
    } else { // eg. https://www.qantasnewsroom.com.au/gallery/qantas-crew-mini-uniforms/
      const cells = [['Cards (banner)']];
      fullWidthContainer.querySelectorAll('img').forEach((img) => {
        // check to see if there is a higher resolution image available
        if (img.parentElement.tagName.toLowerCase() === 'a' && img.parentElement.getAttribute('href')) {
          img.src = img.parentElement.getAttribute('href');
        }
        cells.push([img]);
      });
      const table = WebImporter.DOMUtils.createTable(cells, document);
      fullWidthContainer.replaceWith(table);
    }
  }
}

// Get the number of columns in the table - return max column count in it's rows
function getMaxColumnCount(table) {
  let maxColumns = 0;
  table?.querySelectorAll('tr').forEach((row) => {
    let columnCount = 0;
    row.querySelectorAll('td, th').forEach((cell) => {
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      columnCount += colspan;
    });
    maxColumns = Math.max(maxColumns, columnCount);
  });
  return maxColumns;
}

const tableColsMap = {
  1: 'table-col-1',
  2: 'table-col-2',
  3: 'table-col-3',
  4: 'table-col-4',
  5: 'table-col-5',
  6: 'table-col-6',
  7: 'table-col-7',
  10: 'table-col-10',
};

/**
 * Creates a table block structure that preserves rowspan and colspan attributes
 * @param {HTMLTableElement} table - The source HTML table element
 * @param {number} maxColumnCount - Maximum number of columns in the table
 * @returns {Array<Array<string>>} - 2D array representing the table structure
 */
function createTableBlock(table, maxColumnCount) {
  // Initialize the table cells array with the header row
  const tableCells = [['Table (no-header)']];
  const rows = table.querySelectorAll('tr');
  const rowCount = rows.length;
  
  // Create a 2D grid to track cell positions and their spans
  // This grid will help us maintain the structure of rowspan and colspan cells
  const grid = Array(rowCount).fill().map(() => Array(maxColumnCount).fill(null));
  
  // First pass: Process the table and fill the grid with cell information
  // This pass identifies all cells, their spans, and their positions
  rows.forEach((row, rowIndex) => {
    let colIndex = 0;
    row.querySelectorAll('td, th').forEach((cell) => {
      // Skip positions that are already filled by a spanning cell from a previous row
      while (colIndex < maxColumnCount && grid[rowIndex][colIndex] !== null) {
        colIndex++;
      }
      
      // Get the span attributes, defaulting to 1 if not specified
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
      const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
      
      // Fill the grid with this cell's content and span information
      // This creates a complete map of how cells span across rows and columns
      for (let r = 0; r < rowspan; r++) {
        for (let c = 0; c < colspan; c++) {
          if (rowIndex + r < rowCount && colIndex + c < maxColumnCount) {
            grid[rowIndex + r][colIndex + c] = {
              content: cell.innerHTML || '', // The cell's content
              isSpan: r > 0 || c > 0, // Whether this is a spanned position
              originalCell: r === 0 && c === 0 ? cell : null, // Reference to the original cell
              rowspan, // Number of rows this cell spans
              colspan, // Number of columns this cell spans
              isRowSpan: r > 0, // Whether this is a rowspan position
              isColSpan: c > 0  // Whether this is a colspan position
            };
          }
        }
      }
      
      // Move the column index past this cell's span
      colIndex += colspan;
    });
  });
  
  // Second pass: Generate the final table structure
  // This pass creates the actual table cells array based on the grid information
  rows.forEach((row, rowIndex) => {
    // Start each row with the table model identifier
    const cells = [tableColsMap[maxColumnCount]];
    
    // Process each column in the current row
    for (let colIndex = 0; colIndex < maxColumnCount; colIndex++) {
      const cell = grid[rowIndex][colIndex];
      if (cell) {
        if (!cell.isSpan) {
          // This is an original cell (not a span)
          cells.push(cell.content);
        } else if (cell.isRowSpan) {
          // This is a position in a rowspan
          // Include the content to maintain visual continuity across rows
          cells.push(cell.content);
        } else if (cell.isColSpan) {
          // This is a position in a colspan
          // Include the content to maintain visual continuity across columns
          cells.push(cell.content);
        }
      } else {
        // Empty cell position
        cells.push('');
      }
    }
    
    // Add the completed row to the table
    tableCells.push(cells);
  });
  
  return tableCells;
}

function addTables(main) {
  main.querySelectorAll('table').forEach((table) => {
    const columnCount = getMaxColumnCount(table);
    try {
      const blockTable = WebImporter.DOMUtils.createTable(
        createTableBlock(table, columnCount),
        document,
      );
      table.replaceWith(blockTable);
    } catch (err) {
      console.log(err);
    }
  });
}

// eg. https://www.qantasnewsroom.com.au/media-releases/hugh-jackman-and-qantas-announce-initiative-to-champion-a-new-generation-of-young-indigenous-leaders/
function handleLinkImages(main) {
  const pageContent = main.querySelector('.page-content');
  if (pageContent) {
    // check for links which contain images
    pageContent.querySelectorAll('a')?.forEach((item) => {
      const img = item.querySelector('img');
      if (img) {
        item.replaceWith(img);
      }
    });
  }
}

function addVideos(main) {
  const iframes = main.querySelectorAll('iframe');
  if (iframes) {
    iframes.forEach((iframe) => {
      const cells = [['Embed']];
      const iframeSrc = iframe.src;
      if (iframeSrc && (iframeSrc.includes('youtube') || iframeSrc?.includes('youtu.be'))) {
        cells.push([iframeSrc]);
        const table = WebImporter.DOMUtils.createTable(cells, document);
        iframe.replaceWith(table);
      }
    });
  }
}

function removeSocial(main) {
  const social = main.querySelector('.social');
  social?.remove();
}

// this will come from the page metadata
function removePagePublishedDiv(main) {
  const pagePublished = main.querySelector('.page-published');
  pagePublished?.remove();
}

function removeSidebar(main, url) {
  const sidebar = main.querySelector('.sidebar');
  const urlPath = new URL(url).pathname;
  if (urlPath.includes('/qantas-responds/')
    || urlPath.includes('/media-releases/')
    || urlPath.includes('/speeches/')
    || urlPath.includes('/roo-tales/')
    || urlPath.includes('/uncategorized/')
    || urlPath.includes('/featured/')) {
    const cells = [['Side Navigation (article)']];
    sidebar?.replaceWith(WebImporter.DOMUtils.createTable(cells, document));

    // rearrange the sidebar to be on top of the main content.
    const parent = main.querySelector('.content-wrap');
    const mainSection = parent.children[0];
    const sideNav = parent.children[1];
    if (mainSection && sideNav) {
      parent.insertBefore(sideNav, mainSection);
    }
  } else if (urlPath.includes('/gallery/')
    || urlPath.includes('/gallery-category/')) {
    const cells = [['Side Navigation (gallery)']];
    if (!urlPath.match(/\/gallery\/[^/]+\/?$/)) { // skip for gallery child pages
      const sideNavContent = sidebar.querySelector('.sidebar-intro')?.innerHTML || '';
      cells.push(['']);
      cells.push([sideNavContent]);
    }
    sidebar.replaceWith(WebImporter.DOMUtils.createTable(cells, document));

    // rearrange the title (and text) and side nav into a separate section,
    // by adding a thematicBreak (<hr> tag) after the side nav
    const parent = main.querySelector('.content-wrap');
    const galleryContainer = parent.children[2];
    const sectionBreak = document.createElement('hr');
    parent.insertBefore(sectionBreak, galleryContainer);
  } else {
    sidebar?.remove();
  }
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    // define the main element: the one that will be transformed to Markdown
    const main = document.body;

    WebImporter.DOMUtils.remove(document, [
      'script[src*="https://solutions.invocacdn.com/js/invoca-latest.min.js"]',
    ]);

    // attempt to remove non-content elements
    WebImporter.DOMUtils.remove(main, [
      'header',
      '.header',
      'nav',
      '.nav',
      'footer',
      '.footer',
      'noscript',
      'script',
    ]);

    // handle the tables before adding the metadata table
    addTables(main);

    const meta = WebImporter.Blocks.getMetadata(document);
    setMetadata(meta, document, url);

    const mdb = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(mdb);

    removeSocial(main);
    removeSidebar(main, url);
    removePagePublishedDiv(main);

    addCards(main);
    addGalleryImages(main);
    handleLinkImages(main);
    addVideos(main);
    WebImporter.rules.transformBackgroundImages(main, document);
    // WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

    // remove skip link block
    main.querySelector('.skiplinks')?.remove();
    return main;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    let p = new URL(url).pathname;
    if (p.endsWith('gallery/')) {
      p = `${p}index`;
    }

    return decodeURIComponent(p)
      .toLowerCase()
      .replace(/\.html$/, '')
      .replace(/[^a-z0-9/]/gm, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '');
  },
};
