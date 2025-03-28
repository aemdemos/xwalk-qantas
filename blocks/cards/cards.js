import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1) {
        if (div.querySelector('picture')) {
          div.className = 'cards-card-image';
        } else if (div.querySelector('a')) {
          // If div contains only an anchor tag
          const link = div.querySelector('a');
          const imageDiv = li.querySelector('.cards-card-image');
          if (imageDiv) {
            // Create a new wrapper anchor
            const wrapper = document.createElement('a');
            wrapper.href = link.href;
            // Wrap the picture element with the anchor
            const picture = imageDiv.querySelector('picture');
            if (picture) {
              imageDiv.removeChild(picture);
              wrapper.appendChild(picture);
              imageDiv.appendChild(wrapper);
            }
          }
          // Remove the div containing only the anchor
          div.remove();
        } else {
          div.className = 'cards-card-body';
        }
      } else {
        div.className = 'cards-card-body';
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
