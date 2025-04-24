/**
 * @vitest-environment jsdom
 */

import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import decorate from './table.js';

// Mock the moveInstrumentation function
vi.mock('../../scripts/scripts.js', () => ({
  moveInstrumentation: vi.fn(),
}));

describe('Table Block', () => {
  let block;

  beforeEach(() => {
    // Create a mock block element before each test
    block = document.createElement('div');
  });

  it('creates a table with header and body', async () => {
    // Setup - create a block with header row and data rows
    block.innerHTML = `
      <div>
        <div>Header 1</div>
        <div>Header 2</div>
      </div>
      <div>
        <div>Data 1</div>
        <div>Data 2</div>
      </div>
    `;

    // Execute
    await decorate(block);

    // Verify
    const table = block.querySelector('table');
    expect(table).not.toBeNull();

    // Check header row
    const thead = table.querySelector('thead');
    expect(thead).not.toBeNull();
    expect(thead.querySelectorAll('th').length).toBe(2);
    expect(thead.querySelectorAll('th')[0].textContent).toBe('Header 1');
    expect(thead.querySelectorAll('th')[1].textContent).toBe('Header 2');

    // Check body rows
    const tbody = table.querySelector('tbody');
    expect(tbody).not.toBeNull();
    expect(tbody.querySelectorAll('tr').length).toBe(1);
    expect(tbody.querySelectorAll('td').length).toBe(2);
    expect(tbody.querySelectorAll('td')[0].textContent).toBe('Data 1');
    expect(tbody.querySelectorAll('td')[1].textContent).toBe('Data 2');
  });

  it('creates a table with no header', async () => {
    // Setup - add no-header class and create rows
    block.classList.add('no-header');
    block.innerHTML = `
      <div>
        <div>Data A1</div>
        <div>Data A2</div>
      </div>
      <div>
        <div>Data B1</div>
        <div>Data B2</div>
      </div>
    `;

    // Execute
    await decorate(block);

    // Verify
    const table = block.querySelector('table');
    expect(table).not.toBeNull();

    // Check that there's no thead content
    const thead = table.querySelector('thead');
    expect(thead.children.length).toBe(0);

    // Check that all rows are in tbody
    const tbody = table.querySelector('tbody');
    expect(tbody).not.toBeNull();
    expect(tbody.querySelectorAll('tr').length).toBe(2);
    expect(tbody.querySelectorAll('td').length).toBe(4);
  });
});
