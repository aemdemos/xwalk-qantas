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

        const copyrightText = await this.getCopyrightText();
        this.createPrintVersion(mainContent, copyrightText);
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
        
        // Add header
        printWrapper.appendChild(this.createPrintHeader());
        
        // Add content
        printWrapper.appendChild(this.createPrintContent(mainContent));
        
        // Add copyright if available
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
        
        // Remove social buttons
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
        copyright.innerHTML = text;
        return copyright;
    }

    getCopyrightText() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 5;
            const interval = 500;

            const tryGetCopyright = () => {
                const footerCopyright = document.querySelector('.footer .copyright p');
                if (footerCopyright) {
                    resolve(footerCopyright.innerHTML);
                    return;
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryGetCopyright, interval);
                } else {
                    resolve('');
                }
            };

            tryGetCopyright();
        });
    }

    initializeSocialShare() {
        const title = document.querySelector('h1');
        if (title) {
            const socialElements = this.createSocialElements();
            title.parentNode.insertBefore(socialElements, title.nextSibling);
            new SocialShare();
        }
    }

    createSocialElements() {
        const socialContainer = div({ class: 'social' });

        const fbContainer = this.createFacebookButton();
        socialContainer.appendChild(fbContainer);

        const twitterContainer = this.createTwitterButton();
        socialContainer.appendChild(twitterContainer);

        const printLink = this.createPrintLink();
        socialContainer.appendChild(printLink);

        return socialContainer;
    }

    createFacebookButton() {
        const fbContainer = div({ class: 'fb-like' });
        fbContainer.setAttribute('data-href', window.location.href);
        fbContainer.setAttribute('data-layout', 'button_count');
        fbContainer.setAttribute('data-action', 'like');
        fbContainer.setAttribute('data-size', 'small');
        fbContainer.setAttribute('data-share', 'false');
        return fbContainer;
    }

    createTwitterButton() {
        const twitterContainer = div({ class: 'twitter-container' });
        const twitterButton = document.createElement('a');
        twitterButton.href = 'https://twitter.com/share';
        twitterButton.className = 'twitter-share-button';
        twitterButton.setAttribute('data-url', window.location.href);
        twitterButton.setAttribute('data-text', document.title);
        twitterContainer.appendChild(twitterButton);
        return twitterContainer;
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

class SocialShare {
    constructor() {
        this.initFacebook();
        this.initTwitter();
        this.initPrintFriendly();
    }

    initFacebook() {
        (function(document, scriptTag, scriptId) {
            const firstScript = document.getElementsByTagName(scriptTag)[0];
            if (document.getElementById(scriptId)) return;
            const facebookScript = document.createElement(scriptTag);
            facebookScript.id = scriptId;
            facebookScript.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0";
            firstScript.parentNode.insertBefore(facebookScript, firstScript);
        }(document, 'script', 'facebook-jssdk'));
    }

    initTwitter() {
        window.twttr = (function(document, scriptTag, scriptId) {
            const firstScript = document.getElementsByTagName(scriptTag)[0];
            const twitterWidget = window.twttr || {};
            if (document.getElementById(scriptId)) return twitterWidget;
            const twitterScript = document.createElement(scriptTag);
            twitterScript.id = scriptId;
            twitterScript.src = "https://platform.twitter.com/widgets.js";
            firstScript.parentNode.insertBefore(twitterScript, firstScript);
            twitterWidget._e = [];
            twitterWidget.ready = function(callback) {
                twitterWidget._e.push(callback);
            };
            return twitterWidget;
        }(document, "script", "twitter-wjs"));
    }

    initPrintFriendly() {
        const printButtons = document.querySelectorAll('.print-friendly-version');
        printButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('print', '1');
                window.open(currentUrl.toString(), '_blank', 'noopener,noreferrer');
            });
        });
    }
}

export default function decorate(block) {
    const articleManager = new ArticleManager();
    
    // Only proceed with normal decoration if not in print mode
    if (articleManager.isPrintMode) return;

    const sideNavContainer = block.querySelector('.section.side-navigation-container');
    if (!sideNavContainer) return;

    const articleWrapper = div({ class: 'article-wrapper' });
    
    // Move content to article wrapper
    while (sideNavContainer.firstChild) {
        articleWrapper.appendChild(sideNavContainer.firstChild);
    }

    sideNavContainer.appendChild(articleWrapper);
}
