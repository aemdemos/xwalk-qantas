export default function decorate(block) {
  // Get all the main sections (divs) of the side-nav
  const sections = block.children;

  // Add class names to each section
  if (sections.length >= 1) {
    sections[0].classList.add('heading');
  }

  if (sections.length >= 2) {
    sections[1].classList.add('topics');
  }

  if (sections.length >= 3) {
    sections[2].classList.add('latest');
  }

  // Additional decoration can happen here if needed
}
