import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  if (block.classList.contains('roo-tales')) {
    // Clear existing content
    block.textContent = '';

    try {
      // Fetch data from roo-tales.json
      const response = await fetch('/roo-tales.json');
      const data = await response.json();

      if (data && data.data && Array.isArray(data.data)) {
        const ul = document.createElement('ul');

        // Process each tale
        data.data.forEach((tale) => {
          const li = document.createElement('li');

          // Create image container
          if (tale.image) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'cards-card-image';

            const picture = document.createElement('picture');
            const img = document.createElement('img');
            img.src = tale.image;
            img.alt = tale.title || 'Roo Tale';
            img.loading = 'lazy';

            picture.appendChild(img);
            imageDiv.appendChild(picture);

            // Add link if path exists
            if (tale.path) {
              const wrapper = document.createElement('a');
              wrapper.href = tale.path;
              wrapper.appendChild(picture);
              imageDiv.textContent = '';
              imageDiv.appendChild(wrapper);
            }

            li.appendChild(imageDiv);
          }

          // Create body container
          const bodyDiv = document.createElement('div');
          bodyDiv.className = 'cards-card-body';

          // Add title
          if (tale.title) {
            const titleP = document.createElement('h2');
            titleP.className = 'card-title';
            if (tale.path) {
              const titleLink = document.createElement('a');
              titleLink.href = tale.path;
              titleLink.textContent = tale.title;
              titleP.appendChild(titleLink);
            } else {
              titleP.textContent = tale.title;
            }
            bodyDiv.appendChild(titleP);
          }

          // Add published date if available
          if (tale.publisheddate) {
            const dateP = document.createElement('p');
            dateP.className = 'card-publisheddate';
            const publishedLocation = tale.publishedlocation ? `${tale.publishedlocation} • ` : '';
            dateP.textContent = publishedLocation + tale.publisheddate;
            bodyDiv.appendChild(dateP);
          }

          // Add description if available
          if (tale.description) {
            const descP = document.createElement('p');
            descP.className = 'card-description';
            descP.textContent = tale.description;
            bodyDiv.appendChild(descP);
          }

          if (tale.path) {
            const readMoreP = document.createElement('p');
            readMoreP.className = 'cards-card-read-more';

            const readMoreLink = document.createElement('a');
            readMoreLink.href = tale.path;
            readMoreLink.className = 'read-more';
            readMoreLink.textContent = 'Read more';

            readMoreP.appendChild(readMoreLink);
            bodyDiv.appendChild(readMoreP);
          }

          li.appendChild(bodyDiv);
          ul.appendChild(li);
        });

        // Optimize images
        ul.querySelectorAll('picture > img').forEach((img) => {
          const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
          moveInstrumentation(img, optimizedPic.querySelector('img'));
          img.closest('picture').replaceWith(optimizedPic);
        });

        block.appendChild(ul);
      }
    } catch (error) {
      console.error('Error loading roo-tales data:', error);
      block.innerHTML = '<p>Error loading content.</p>';
    }
  } else {
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
}
