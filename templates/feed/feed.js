export default function decorate(main) {
  const section = main.querySelector('.section.news-feed-container');
  if (!section) return;

  const sideNavigationWrapper = section.querySelector('.side-navigation-wrapper');

  if (!sideNavigationWrapper) return;

  const mainContentWrapper = document.createElement('div');
  mainContentWrapper.className = 'main-content-wrapper';

  const elementsToMove = [];
  Array.from(section.children).forEach((child) => {
    if (child === sideNavigationWrapper) return;
    elementsToMove.push(child);
  });

  section.insertBefore(mainContentWrapper, sideNavigationWrapper);

  elementsToMove.forEach((element) => {
    mainContentWrapper.appendChild(element);
  });

  section.classList.add('feed-layout');
  mainContentWrapper.classList.add('feed-content');
  sideNavigationWrapper.classList.add('feed-sidebar');
}
