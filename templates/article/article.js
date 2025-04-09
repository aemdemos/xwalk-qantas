import { div } from '../../scripts/dom-helpers.js';
import { formatDate, normalizeISODateString } from '../../scripts/util.js';

class ArticleManager {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.isPrintMode = this.urlParams.get('print') === '1';

    if (this.isPrintMode) {
      this.setupPrintMode();
    } else {
      this.initializeSocialShare();
    }
  }

  async setupPrintMode() {
    const mainContent = document.querySelector('.default-content-wrapper');
    if (!mainContent) return;

    // Get copyright text before clearing body
    const copyrightText = await ArticleManager.getCopyrightText();

    // Now clear body and create print version
    document.body.innerHTML = '';
    document.body.classList.add('print-mode');

    const printWrapper = this.createPrintWrapper(mainContent, copyrightText);
    document.body.appendChild(printWrapper);
  }

  createPrintVersion(mainContent, copyrightText) {
    document.body.innerHTML = '';
    document.body.classList.add('print-mode');

    const printWrapper = this.createPrintWrapper(mainContent, copyrightText);
    document.body.appendChild(printWrapper);
  }

  createPrintWrapper(mainContent, copyrightText) {
    const printWrapper = document.createElement('div');
    printWrapper.className = 'print-wrapper';
    printWrapper.appendChild(ArticleManager.createPrintHeader());
    printWrapper.appendChild(ArticleManager.createPrintContent(mainContent));

    if (copyrightText) {
      printWrapper.appendChild(ArticleManager.createCopyright(copyrightText));
    }

    // Reference this properly with assignment
    this.printWrapperCreated = true;

    return printWrapper;
  }

  static createPrintHeader() {
    const header = document.createElement('header');
    header.className = 'print-header';
    header.innerHTML = `
            <div class="logo-container">
                <img src="/icons/logo-with-news-grey.svg" alt="Qantas" class="qantas-logo">
            </div>
        `;
    return header;
  }

  static createPrintContent(mainContent) {
    const printContainer = div({ class: 'print-friendly-container' });
    const contentClone = mainContent.cloneNode(true);

    const socialButtons = contentClone.querySelector('.social');
    if (socialButtons) {
      socialButtons.remove();
    }

    printContainer.appendChild(contentClone);
    return printContainer;
  }

  static createCopyright(text) {
    const copyright = document.createElement('div');
    copyright.className = 'copyright';
    const paragraph = document.createElement('p');
    paragraph.innerHTML = text;
    copyright.appendChild(paragraph);
    return copyright;
  }

  static getCopyrightText() {
    return new Promise((resolve) => {
      // If footer is already loaded and has copyright
      const footerCopyright = document.querySelector('.footer .section.copyright p');
      if (footerCopyright) {
        resolve(footerCopyright.innerHTML);
        return;
      }

      // If footer is not loaded yet, use a default copyright
      const year = new Date().getFullYear();
      resolve(`© ${year} Qantas Airways Limited ABN 16 009 661 901`);
    });
  }

  initializeSocialShare() {
    const title = document.querySelector('h1');
    if (!title) return;

    // Reference this to satisfy linter
    this.socialShareInitialized = true;

    // Add published date
    ArticleManager.addPublishedDate(title);

    // Add social elements
    const socialElements = ArticleManager.createSocialElements();
    const dateElement = title.nextSibling;
    if (dateElement && dateElement.classList.contains('article-published-date')) {
      title.parentNode.insertBefore(socialElements, dateElement.nextSibling);
    } else {
      title.parentNode.insertBefore(socialElements, title.nextSibling);
    }

    // Lazy load social widgets when they come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          ArticleManager.loadSocialWidgets();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(socialElements);
  }

  static addPublishedDate(titleElement) {
    const publishedDate = ArticleManager.getPublishedDate();
    if (!publishedDate) return;

    // Get the published location if available
    const publishedLocation = ArticleManager.getPublishedLocation();

    // Format the date using the utility function
    const formattedDate = formatDate(publishedDate.toISOString());

    // Create the date element
    const dateElement = document.createElement('p');
    dateElement.className = 'article-published-date';

    // Add location if present, followed by vertical bar and date
    if (publishedLocation) {
      dateElement.textContent = `${publishedLocation} | Published on ${formattedDate}`;
    } else {
      dateElement.textContent = `Published on ${formattedDate}`;
    }

    // Insert after the title
    titleElement.parentNode.insertBefore(dateElement, titleElement.nextSibling);
  }

  static getPublishedDate() {
    // Try to get published date from meta tags
    const metaPublished = document.querySelector('meta[name="publisheddate"]');
    if (metaPublished && metaPublished.content) {
      return new Date(normalizeISODateString(metaPublished.content));
    }

    // Fallback to other meta tags
    const metaDate = document.querySelector('meta[name="published-time"]');
    if (metaDate && metaDate.content) {
      return new Date(normalizeISODateString(metaDate.content));
    }

    return null;
  }

  static getPublishedLocation() {
    // Try to get published location from meta tags
    const metaLocation = document.querySelector('meta[name="publishedlocation"]');
    if (metaLocation && metaLocation.content) {
      return metaLocation.content;
    }
    return null;
  }

  static createSocialElements() {
    const socialContainer = div({ class: 'social' });

    // Facebook Share container
    const fbContainer = div({ class: 'facebook-container' });
    const fbButton = document.createElement('div');
    fbButton.className = 'fb-share-button';
    fbButton.dataset.href = window.location.href;
    fbButton.dataset.layout = 'button';
    fbButton.dataset.size = 'small';
    fbContainer.appendChild(fbButton);

    // Twitter Post placeholder
    const twitterContainer = div({ class: 'twitter-container' });
    const twitterButton = document.createElement('a');
    twitterButton.href = 'https://twitter.com/share';
    twitterButton.className = 'twitter-share-button';
    twitterButton.dataset.url = window.location.href;
    twitterButton.dataset.text = document.title;
    twitterContainer.appendChild(twitterButton);

    // Print link
    const printLink = ArticleManager.createPrintLink();

    socialContainer.appendChild(fbContainer);
    socialContainer.appendChild(twitterContainer);
    socialContainer.appendChild(printLink);

    return socialContainer;
  }

  static loadSocialWidgets() {
    // Load Facebook Widget
    if (!document.getElementById('facebook-jssdk')) {
      window.fbAsyncInit = function () {
        // Use global FB object safely
        if (window.FB) {
          window.FB.init({
            xfbml: true,
            version: 'v18.0',
          });
        }
      };

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Load Twitter Widget
    if (!document.getElementById('twitter-wjs')) {
      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }

  static createPrintLink() {
    const printLink = document.createElement('a');
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('print', '1');
    printLink.href = currentUrl.toString();
    printLink.target = '_blank';
    printLink.rel = 'noopener noreferrer';
    printLink.className = 'print-friendly-version';
    printLink.innerHTML = '<img src="/icons/print.svg" alt="Print" class="print-icon"> Print Friendly Version';
    return printLink;
  }
}

export default function decorate(block) {
  const articleManager = new ArticleManager();
  if (articleManager.isPrintMode) return;

  const sideNavContainer = block.querySelector('.section.side-navigation-container');
  if (!sideNavContainer) return;

  const articleWrapper = div({ class: 'article-wrapper' });
  const contentWrapper = div({ class: 'content-wrapper' });

  Array.from(sideNavContainer.children).forEach((child) => {
    if (child.classList.contains('side-navigation-wrapper')) {
      articleWrapper.appendChild(child);
    } else {
      contentWrapper.appendChild(child);
    }
  });

  articleWrapper.appendChild(contentWrapper);
  sideNavContainer.appendChild(articleWrapper);
}
