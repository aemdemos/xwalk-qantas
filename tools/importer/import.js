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

// Convert text date in the format 'Published on 28th October 2015 at 9:17' to '2015-10-28T9:17:00.000Z' format
function convertToISO(dateString) {
    // Extracting the date and time using regex
    const regex = /(Published|Posted) on (\d{1,2})(?:st|nd|rd|th)? (\w+) (\d{4}) at (\d{1,2}):(\d{2})/;;
    const match = dateString.match(regex);

    if (!match) {
        return null;
    }

    // Extracting parts
    const [, , day, month, year, hours, minutes] = match;

    // Month mapping
    const monthMap = {
        January: "01", February: "02", March: "03", April: "04",
        May: "05", June: "06", July: "07", August: "08",
        September: "09", October: "10", November: "11", December: "12"
    };

    const monthNumber = monthMap[month];

    if (!monthNumber) {
        return null;
    }

    // Construct ISO format
    return `${year}-${monthNumber}-${day.padStart(2, '0')}T${hours}:${minutes}:00.00`;
}

// for article, add the published date and intro to the page metadata 
function addPageIntroAndPublishedMetadata(document, meta, url) {
  const pathname = new URL(url).pathname;
  const pageContent = document.querySelector(".page-content")?.innerText.trim();
  let intro;
  if (pageContent && pageContent.length > 400) {
    let trimmedContent = pageContent.slice(0, 400);

    // Ensure we don't cut off in the middle of a word
    let lastSpaceIndex = trimmedContent.lastIndexOf(" ");
    if (lastSpaceIndex > 0) {
        trimmedContent = trimmedContent.slice(0, lastSpaceIndex);
    }

    intro = trimmedContent + " […]"; // Append the indicator for more content
  } else {
    intro = pageContent; // If it's less than 300 characters, keep it as is
  }
  meta['intro'] = intro;
  const pageIntro = document.querySelector(".page-intro");
  const publishedDateStr = pageIntro?.querySelector(".page-published-date")?.innerText.trim() || "";
  meta['publishedDate'] = convertToISO(publishedDateStr) || '';
  meta['publishedLocation'] = pageIntro?.querySelector(".page-published-location")?.innerText.trim() || '';
}

function addSidebarInfoToMetadata(document, meta) {
  const sidebarIntro = document.querySelector(".sidebar-intro");
  // add the sidebar metadata for gallery-template-default page
  if (sidebarIntro && document.querySelector(".gallery-template-default")) {
    const paragraphs = sidebarIntro.querySelectorAll("p");
    meta['imageCount'] = paragraphs[0]?.textContent.trim();
    meta['publishedDate'] = paragraphs[1]?.textContent.trim();
  }

  // add the topics (if present) for /media-releases/<articles>
  if (document.querySelector(".sidebar-topics")) {
    const topics = [];
    document.querySelectorAll(".sidebar-topic").forEach((topic) => {
      const link = topic.querySelector("a"); // Get the anchor element
      if (link) {
        topics.push(link.className)
      }
    });
    meta['pageTopics'] = topics;
  }
}

function setMetadata(meta, document, url) {
  delete meta['og:title'];
  delete meta['og:description'];
  delete meta['twitter'];

  // Rename "Title" to "jcr:title" if it exists
  if ('Title' in meta) {
    meta['jcr:title'] = meta['Title'];
    delete meta['Title'];
  }
  // Rename "Description" to "jcr:description" if it exists
  if ('Description' in meta) {
    meta['jcr:description'] = meta['Description'];
    delete meta['Description'];
  }

  // Rename "Image" to "image" if it exists
  if ('Image' in meta) {
    // somehow the img in the meta has the url appended twice, hence this song and dance
    delete meta['Image'];
    const img = document.createElement("img"); 
    img.src = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    meta['image'] = img;
  }

  addPageIntroAndPublishedMetadata(document, meta, url);
  addSidebarInfoToMetadata(document, meta);
}

// Galley-Category NOT TO BE IMPORTED
function getGalleyCategoryCards(galleries) {
  //const cells = [['GalleryCategoryCards']];
  const cells = [['Cards']];
  galleries.forEach((gallery) => {
    const href = gallery.querySelector(".gallery-image")?.getAttribute("href");
    const img = gallery.querySelector(".gallery-image img");
    const meta = gallery.querySelector(".gallery-meta").innerText;
    const text = gallery.querySelector(".gallery-text");
    const title = text.querySelector(".title").innerText;
    const description = text.querySelector(".gallery-description")?.innerText;
    const formattedText = description ? `<h3>${title}</h3>\n<p>${description}</p>` : `<h3>${title}</h3>`;
    const cell = [img, meta, formattedText, href];
    cells.push(cell);
  });
  return cells;
}

function innerGalleryCards(main) {
  const cells = [['Cards (banner)']];
  main.querySelectorAll(".swipebox").forEach((item) => {
    cells.push([item.querySelector("img")]);
  });
  return cells;
}

function getGalleryCards(main) {
  const cells = [['Cards (thumbnail)']];
  main.querySelectorAll(".galleries-module ul li").forEach((item) => {
    const href = item.querySelector(".gallery-image")?.getAttribute("href");
    const img = item.querySelector(".gallery-image img");
    const meta = item.querySelector(".gallery-meta").innerText;
    const cell = [img, meta, href];
    cells.push(cell);
  });
  return cells;
}

function getTopicCards(topicsModule) {
  const cells = [['Topic Cards']];
  topicsModule.querySelectorAll("li").forEach((topic) => {
    const topicTitle = topic.querySelector(".topic-title")?.innerText;
    const backgroundImg = topic.querySelector(".topics-background");
    const overlayImg = topic.querySelector(".topic-overlay img");
    overlayImg.classList.replace("hide-ie", "overylay-image")
    const href = topic.querySelector(".topic-overlay")?.getAttribute("href");
    const cell = [backgroundImg, overlayImg, href, topicTitle];
    cells.push(cell);
  });
  return cells;
}

function addCards(main) {
  const galleriesModule = main.querySelector(".galleries-module");
  if (galleriesModule) {
    let cells;
    const galleries = galleriesModule.querySelectorAll(".gallery");
    if (galleries && galleries.length > 0) {
      // cells = getGalleyCategoryCards(galleries); NOT TO BE IMPORTED
    } else {
      cells = getGalleryCards(main);
    }
    const table = WebImporter.DOMUtils.createTable(cells, document);
    galleriesModule.replaceWith(table);
  } else {
    const topicsModule = main.querySelector(".topics-module");
    if (topicsModule) {
      const cells = getTopicCards(topicsModule);
      const table = WebImporter.DOMUtils.createTable(cells, document);
      topicsModule.replaceWith(table);
    }
  }
};

function addGalleryImages(main) {
  const gallery = main.querySelector(".gallery");
  if (gallery) {
    const cells = innerGalleryCards(main);
    const table = WebImporter.DOMUtils.createTable(cells, document);
    gallery.replaceWith(table);
  } else if (main.querySelector(".full-width")) {
    const cells = [['Cards']];

    main.querySelectorAll("img").forEach((item) => {
      cells.push([item]);
    });
    const table = WebImporter.DOMUtils.createTable(cells, document);
    main.querySelector(".full-width").replaceWith(table);

  }
}

// Get the number of columns in the table - return max column count in it's rows
function getMaxColumnCount(table) {
  let maxColumns = 0;
  table?.querySelectorAll("tr").forEach((row) => {
    const columnCount = row.querySelectorAll("td, th").length;
    maxColumns = Math.max(maxColumns, columnCount);
  });
  return maxColumns;
}

const tableColsMap = {
  1: "table-row",
  2: "table-col-2",
  3: "table-col-3",
  4: "table-col-4",
  5: "table-col-5",
  6: "table-col-6"
};

function getBoldRowsAndCols(table) {
    const rows = [...table.querySelectorAll("tr")];
    const colCount = rows[0].querySelectorAll("td, th").length;
    
    let boldRows = new Set();
    let boldCols = new Array(colCount).fill(true);
    
    rows.forEach((row, rowIndex) => {
        const cells = [...row.querySelectorAll("td, th")];
        
        if (cells.every(cell => cell.querySelector("strong"))) {
            boldRows.add(`bold-row-${rowIndex + 1}`);
        }
        
        cells.forEach((cell, colIndex) => {
            if (!cell.querySelector("strong")) {
                boldCols[colIndex] = false;
            }
        });
    });
    
    let boldColResults = boldCols
      .map((isBold, index) => isBold ? `bold-col-${index + 1}` : null)
      .filter(Boolean);
    
    return [...boldRows, ...boldColResults].join(", ");
}

function createTableBlock(table, maxColumnCount, boldRowColClasses) {
  const tableCells = [['Table' + (boldRowColClasses ? ' (no-header, ' + boldRowColClasses + ')' : ' (no-header)')]];

  table.querySelectorAll("tr").forEach((row) => {
    const cells = [tableColsMap[maxColumnCount]]; // add the modelId as the first cell in the rows
    const cols = row.querySelectorAll("td, th");
    let thisColCount = cols.length;
    cols.forEach((col) => { // add the data from page table
      cells.push(col.innerText? col.innerText : '');
    });
    // fill in empty cells for missing column data
    while (thisColCount++ < maxColumnCount) {
      cells.push('');
    }
    tableCells.push(cells);
  });
  return tableCells;
}

function addTables(main) {
  const tables = main.querySelectorAll("table").forEach((table) => {
    const columnCount = getMaxColumnCount(table);
    let boldRowColClasses = getBoldRowsAndCols(table);
    try {
      const blockTable = WebImporter.DOMUtils.createTable(createTableBlock(table, columnCount, boldRowColClasses), document);
      table.replaceWith(blockTable);
    } catch(err) {
      console.log(err);
    }
  });
}

// eg. https://www.qantasnewsroom.com.au/media-releases/hugh-jackman-and-qantas-announce-initiative-to-champion-a-new-generation-of-young-indigenous-leaders/
function handleLinkImages(main) {
  const pageContent = main.querySelector(".page-content");
  if (pageContent) {
    // check for links which contain images
    pageContent.querySelectorAll("a")?.forEach((item) => {
      const img = item.querySelector("img");
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
  const social = main.querySelector(".social");
  social?.remove();
}

// this will come from the page metadata
function removePagePublishedDiv(main) {
  const pagePublished = main.querySelector(".page-published");
  pagePublished?.remove();
}

function removeSidebar(main, url) {
  const sidebar = main.querySelector(".sidebar");
  if (url.includes("/qantas-responds/")
      || url.includes("/media-releases/")
      || url.includes("/speeches/")
      || url.includes("/roo-tales/")
      || url.includes("/uncategorized/")
      || url.includes("/featured/")
    ) {
    const cells = [["Side Navigation (article)"]];
    sidebar?.replaceWith(WebImporter.DOMUtils.createTable(cells, document));

    // rearrange the side bar to be on top of the main content.
    const parent = main.querySelector(".content-wrap");
    const mainSection = parent.children[0];
    const sideNav = parent.children[1];
    if (mainSection && sideNav) {
      parent.insertBefore(sideNav, mainSection);
    }
  }
  sidebar?.remove();
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
    main.querySelector(".skiplinks")?.remove();
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
