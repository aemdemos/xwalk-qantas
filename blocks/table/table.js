/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Analyzes table data to find cells that should be merged based on specific rules:
 * 1. Merge continuous cells in first column with same content
 * 2. Merge continuous cells in rows with same content (anywhere in the row)
 *
 * @param {Array<Array<string>>} tableData - 2D array of cell values
 * @returns {Array<Array<{value: string, rowspan: number, colspan: number, skip: boolean}>>}
 *   Processed table data with spans
 */
function analyzeTableData(tableData) {
  const rows = tableData.length;
  const cols = tableData[0].length;

  // Initialize processed data structure
  const processedData = Array(rows).fill().map((_, rowIndex) => Array(cols).fill()
    .map((__, colIndex) => ({
      value: tableData[rowIndex][colIndex],
      rowspan: 1,
      colspan: 1,
      skip: false,
    })));

  // Helper function to check if a value is valid for merging
  const isValidForMerging = (value) => value && value.trim() !== '';

  // First pass: Handle rowspan (vertical merging) - ONLY for first column
  for (let row = 0; row < rows; row += 1) {
    if (processedData[row][0].skip) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const currentValue = tableData[row][0];

    // Only process cells with valid content in first column
    if (!isValidForMerging(currentValue)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    let rowspan = 1;

    // Look down to find consecutive cells with identical content in first column
    for (let nextRow = row + 1; nextRow < rows; nextRow += 1) {
      const nextValue = tableData[nextRow][0];

      // Both cells must have valid content, be identical, and not already skipped
      if (isValidForMerging(nextValue)
          && nextValue === currentValue
          && !processedData[nextRow][0].skip) {
        rowspan += 1;
        processedData[nextRow][0].skip = true;
      } else {
        break;
      }
    }

    processedData[row][0].rowspan = rowspan;
  }

  // Second pass: Handle colspan (horizontal merging) - for any consecutive cells with same content
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (processedData[row][col].skip) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const currentValue = tableData[row][col];

      // Only process cells with valid content
      if (!isValidForMerging(currentValue)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      let colspan = 1;

      // Look ahead to find consecutive cells with identical content
      for (let nextCol = col + 1; nextCol < cols; nextCol += 1) {
        const nextValue = tableData[row][nextCol];

        // Both cells must have valid content and be identical
        if (isValidForMerging(nextValue) && nextValue === currentValue) {
          colspan += 1;
          processedData[row][nextCol].skip = true;
        } else {
          break;
        }
      }

      processedData[row][col].colspan = colspan;
    }
  }

  return processedData;
}

/**
 * Decorates a table block by analyzing and grouping consecutive cells with specific merging rules
 *
 * @param {Element} block - The table block element to decorate
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');

  // Collect all cell values from the table
  const tableData = [...block.children].map((row) => [...row.children]
    .map((cell) => cell.textContent.trim()));

  // Analyze the table data to find groups of cells with same content
  const processedData = analyzeTableData(tableData);

  // Create the table structure with the identified spans
  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);

    [...row.children].forEach((cell, j) => {
      const cellData = processedData[i][j];
      if (cellData.skip) return; // Skip cells that are part of a span

      const td = document.createElement(i === 0 && header ? 'th' : 'td');
      if (i === 0 && header) td.setAttribute('scope', 'column');

      // Apply the identified spans to the cell
      if (cellData.rowspan > 1) td.setAttribute('rowspan', cellData.rowspan);
      if (cellData.colspan > 1) td.setAttribute('colspan', cellData.colspan);

      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });

    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });

  table.append(thead, tbody);
  block.replaceChildren(table);
}
