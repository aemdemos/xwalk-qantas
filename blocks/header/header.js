import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 1024px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container elemen
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

// Helper function to create a search bar container
function createSearchBar() {
  const searchBar = document.createElement('div');
  searchBar.className = 'search-container';
  searchBar.innerHTML = `
    <form class="search-form" role="search" action="/search">
      <input type="search" name="q" aria-label="Search">
      <button type="submit" aria-label="Submit search" class="search-button"></button>
    </form>
  `;
  return searchBar;
}

/**
 * Creates and adds a mobile menu section with the nav-tools buttons
 * @param {Element} navSections The nav sections container
 */
function setupMobileToolsMenu(nav) {
  // Check if the mobile tools menu already exists
  if (nav.querySelector('.mobile-tools-menu')) {
    return;
  }
  const navTools = document.querySelector('.nav-tools');
  if (!navTools) {
    return;
  }
  // Create mobile tools menu
  const mobileToolsMenu = document.createElement('div');
  mobileToolsMenu.className = 'mobile-tools-menu';
  // Clone button containers
  const buttonContainers = navTools.querySelectorAll('.button-container');
  const buttonList = document.createElement('ul');

  // Add search bar as first item in the list
  const searchLi = document.createElement('li');
  searchLi.className = 'nav-button search-button-item';
  const searchBar = createSearchBar();
  searchLi.appendChild(searchBar);
  buttonList.appendChild(searchLi);

  buttonContainers.forEach((container) => {
    const listItem = document.createElement('li');
    const button = container.querySelector('a.button');
    if (button) {
      listItem.appendChild(button.cloneNode(true));
    }
    buttonList.appendChild(listItem);
  });
  mobileToolsMenu.appendChild(buttonList);
  if (nav) {
    nav.appendChild(mobileToolsMenu);
  }
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container elemen
 * @param {Element} navSections The nav sections within the container elemen
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  if (!expanded && !isDesktop.matches) {
    setupMobileToolsMenu(nav);
  }
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus los
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block elemen
 */
export default async function decorate(block) {
  // load nav as fragmen
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  // Wrap all children of nav-brand in a brand-wrapper
  if (navBrand) {
    const brandWrapper = document.createElement('div');
    brandWrapper.className = 'brand-wrapper';
    // Move all children to the wrapper
    while (navBrand.firstChild) {
      brandWrapper.appendChild(navBrand.firstChild);
    }
    // Add the wrapper back to navBrand
    navBrand.appendChild(brandWrapper);
  }

  // Add search bar to navBrand
  const navBrandContent = navBrand.querySelector('.brand-wrapper');
  if (navBrandContent) {
    // Create a custom search bar for the brand section
    const searchBar = document.createElement('div');
    searchBar.className = 'search-container brand-search';
    searchBar.innerHTML = `
      <form class="search-form" role="search" action="https://qantas.resultspage.com/search">
        <input type="search" name="w" aria-label="Search" placeholder="Search...">
        <button type="submit" aria-label="Submit search" class="search-button"></button>
      </form>
    `;
    navBrandContent.appendChild(searchBar);
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });

    const searchContainer = document.querySelector('.nav-tools .search-container');
    if (searchContainer) {
      // Clone the desktop search but adjust action to mobile version
      const searchBar = createSearchBar();
      const mobileSearchWrapper = document.createElement('div');
      mobileSearchWrapper.className = 'mobile-search-wrapper';
      mobileSearchWrapper.appendChild(searchBar);
      navSections.appendChild(mobileSearchWrapper);
    }
  }

  // Highlight current section in nav-tools based on URL
  const currentUrl = window.location.href.toLowerCase();
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const navLinks = navTools.querySelectorAll('.button');

    // Make the first paragraph in navTools a link to the homepage
    const firstP = navTools.querySelector('.default-content-wrapper > p:first-child');
    if (firstP && !firstP.querySelector('a')) {
      const img = firstP.querySelector('img');
      const linkContent = img ? img.outerHTML : firstP.innerHTML;
      const homeLink = document.createElement('a');
      homeLink.href = '/';
      homeLink.innerHTML = linkContent;
      homeLink.classList.add('icon-logo-grey-news-room');
      firstP.innerHTML = '';
      firstP.appendChild(homeLink);
    }

    // Check if URL is just the host (home page)
    const isHomePage = new URL(currentUrl).pathname === '/' || new URL(currentUrl).pathname === '';

    navLinks.forEach((link) => {
      const linkText = link.textContent.trim().toLowerCase();
      // Check if URL contains the link text or matches specific patterns
      if ((isHomePage && linkText === 'home')
          || currentUrl.includes(linkText)
          || (linkText === 'qantas responds' && currentUrl.includes('qantas-responds'))
          || (linkText === 'media releases' && currentUrl.includes('media-releases'))
          || (linkText === 'speeches' && currentUrl.includes('speeches'))
          || (linkText === 'gallery' && currentUrl.includes('gallery'))
          || (linkText === 'media enquiries' && currentUrl.includes('media-enquiries'))
          || (linkText === 'roo tales' && currentUrl.includes('roo-tales'))) {
        link.style.color = '#E3001B'; // Red color
      }
    });

    // Add search bar at the end of nav-tools
    const navToolsContent = navTools.querySelector('.default-content-wrapper');
    if (navToolsContent) {
      const searchBar = createSearchBar();
      navToolsContent.appendChild(searchBar);
    }
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
