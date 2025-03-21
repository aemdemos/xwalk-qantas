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

// for /media-releases/<page> and /roo-tales/<page>, add the published date and intro to the page metadata 
function addPageIntoAndPublishedDateToMetadata(document, meta, url) {
  const pathname = new URL(url).pathname;
  if (pathname.startsWith("/media-releases/") || pathname.startsWith("/roo-tales/")) {
    const pageContent = document.querySelector(".page-content")?.innerText.trim();
    let pageIntro;
    if (pageContent.length > 500) {
      let trimmedContent = pageContent.slice(0, 500);

      // Ensure we don't cut off in the middle of a word
      let lastSpaceIndex = trimmedContent.lastIndexOf(" ");
      if (lastSpaceIndex > 0) {
          trimmedContent = trimmedContent.slice(0, lastSpaceIndex);
      }

      pageIntro = trimmedContent + " […]"; // Append the indicator for more content
    } else {
      pageIntro = pageContent; // If it's less than 300 characters, keep it as is
    }
    meta['intro'] = pageIntro;
    meta['publishedDate'] = document.querySelector(".page-intro")?.querySelector(".page-published-date")?.innerText;
  }
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

  addPageIntoAndPublishedDateToMetadata(document, meta, url);
  addSidebarInfoToMetadata(document, meta);
}

// NOT TO BE IMPORTED
function getGalleyCategoryCards(galleries) {
  //const cells = [['GalleryCategoryCards']];
  const cells = [['Cards']];
  galleries.forEach((gallery) => {
    const href = gallery.querySelector(".gallery-image")?.getAttribute("href");
    const img = gallery.querySelector(".gallery-image img");
    const meta = gallery.querySelector(".gallery-meta").innerHTML;
    const text = gallery.querySelector(".gallery-text");
    const title = text.querySelector(".title").innerHTML;
    const description = text.querySelector(".gallery-description")?.innerHTML;
    const formattedText = description ? `<h3>${title}</h3>\n<p>${description}</p>` : `<h3>${title}</h3>`;
    const cell = [img, meta, formattedText, href];
    cells.push(cell);
  });
  return cells;
}

function getGalleryCards(main) {
  const cells = [['Gallery Cards']];
  main.querySelectorAll(".galleries-module ul li").forEach((item) => {
    const href = item.querySelector(".gallery-image")?.getAttribute("href");
    const img = item.querySelector(".gallery-image img");
    const meta = item.querySelector(".gallery-meta").innerHTML;
    const cell = [img, meta, href];
    cells.push(cell);
  });
  return cells;
}

function getTopicCards(topicsModule) {
  const cells = [['Topic Cards']];
  topicsModule.querySelectorAll("li").forEach((topic) => {
    const topicTitle = topic.querySelector(".topic-title")?.innerHTML;
    const backgroundImg = topic.querySelector(".topics-background");
    const overlayImg = topic.querySelector(".topic-overlay img");
    overlayImg.classList.replace("hide-ie", "overylay-image")
    const href = topic.querySelector(".topic-overlay")?.getAttribute("href");
    const cell = [backgroundImg, overlayImg, href, topicTitle];
    cells.push(cell);
  });
  return cells;
}

const addCards = (main) => {
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

const addGalleryImages = (main) => {
  const gallery = main.querySelector(".gallery");
  if (gallery) {
    const cells = [['Cards']];

    main.querySelectorAll(".swipebox").forEach((item) => {
      cells.push([item.querySelector("img")]);
    });
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

// eg. https://www.qantasnewsroom.com.au/media-releases/hugh-jackman-and-qantas-announce-initiative-to-champion-a-new-generation-of-young-indigenous-leaders/
const handleLinkImages = (main) => {
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

const addVideo = (main) => {
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

const removeSocial = (main) => {
  const social = main.querySelector(".social");
  social?.remove();
}

const removeSidebar = (main) => {
  const sidebar = main.querySelector(".sidebar");
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

    const meta = WebImporter.Blocks.getMetadata(document);
    setMetadata(meta, document, url);

    const mdb = WebImporter.Blocks.getMetadataBlock(document, meta);
    main.append(mdb);

    removeSocial(main);
    removeSidebar(main);

    addCards(main);
    addGalleryImages(main);
    handleLinkImages(main);
    addVideo(main);
    WebImporter.rules.transformBackgroundImages(main, document);
    // WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    WebImporter.rules.convertIcons(main, document);

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

    return decodeURIComponent(p)
    .toLowerCase()
    .replace(/\.html$/, '')
    .replace(/[^a-z0-9/]/gm, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
  },
};
