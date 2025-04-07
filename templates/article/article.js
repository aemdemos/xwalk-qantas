import { div } from '../../scripts/dom-helpers.js';

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
    const copyrightText = await this.getCopyrightText();

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
    printWrapper.appendChild(this.createPrintHeader());
    printWrapper.appendChild(this.createPrintContent(mainContent));

    if (copyrightText) {
      printWrapper.appendChild(this.createCopyright(copyrightText));
    }

    return printWrapper;
  }

  createPrintHeader() {
    const header = document.createElement('header');
    header.className = 'print-header';
    header.innerHTML = `
            <div class="logo-container">
                <img src="/icons/logo-with-news-grey.svg" alt="Qantas" class="qantas-logo">
            </div>
        `;
    return header;
  }

  createPrintContent(mainContent) {
    const printContainer = div({ class: 'print-friendly-container' });
    const contentClone = mainContent.cloneNode(true);

    const socialButtons = contentClone.querySelector('.social');
    if (socialButtons) {
      socialButtons.remove();
    }

    printContainer.appendChild(contentClone);
    return printContainer;
  }

  createCopyright(text) {
    const copyright = document.createElement('div');
    copyright.className = 'copyright';
    const paragraph = document.createElement('p');
    paragraph.innerHTML = text;
    copyright.appendChild(paragraph);
    return copyright;
  }

  getCopyrightText() {
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

    const socialElements = this.createSocialElements();
    title.parentNode.insertBefore(socialElements, title.nextSibling);

    // Lazy load social widgets when they come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadSocialWidgets();
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(socialElements);
  }

  createSocialElements() {
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
    const printLink = this.createPrintLink();

    socialContainer.appendChild(fbContainer);
    socialContainer.appendChild(twitterContainer);
    socialContainer.appendChild(printLink);

    return socialContainer;
  }

  loadSocialWidgets() {
    // Load Facebook Widget
    if (!document.getElementById('facebook-jssdk')) {
      window.fbAsyncInit = function () {
        FB.init({
          xfbml: true,
          version: 'v18.0',
        });
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

  createPrintLink() {
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
