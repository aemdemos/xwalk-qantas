/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Analyzes table data to find consecutive cells with same values and group them using rowspan/colspan
 * This function processes the table in two passes:
 * 1. First pass: Identifies and groups consecutive cells with same values in columns (rowspan)
 * 2. Second pass: Identifies and groups consecutive cells with same values in rows (colspan)
 * 
 * @param {Array<Array<string>>} tableData - 2D array of cell values
 * @returns {Array<Array<{value: string, rowspan: number, colspan: number}>>} - Processed table data with spans
 */
function analyzeTableData(tableData) {
  const rows = tableData.length;
  const cols = tableData[0].length;
  // Initialize a 2D array to store processed data with span information
  const processedData = Array(rows).fill().map(() => Array(cols).fill(null));
  
  // First pass: Process columns to find consecutive cells with same values (rowspan)
  // This creates vertical groupings of cells
  for (let col = 0; col < cols; col++) {
    let currentValue = null;
    let rowspan = 1;
    let startRow = 0;
    
    for (let row = 0; row < rows; row++) {
      const value = tableData[row][col];
      
      if (value === currentValue) {
        // Found consecutive cell with same value, increment rowspan
        rowspan++;
        if (row === rows - 1) {
          // Last row, apply the span for the final group
          processedData[startRow][col] = { value: currentValue, rowspan, colspan: 1 };
        }
      } else {
        if (currentValue !== null) {
          // Different value found, apply the span for the previous group
          processedData[startRow][col] = { value: currentValue, rowspan, colspan: 1 };
        }
        // Start tracking new value
        currentValue = value;
        rowspan = 1;
        startRow = row;
      }
    }
  }
  
  // Second pass: Process rows to find consecutive cells with same values (colspan)
  // This creates horizontal groupings of cells
  for (let row = 0; row < rows; row++) {
    let currentValue = null;
    let colspan = 1;
    let startCol = 0;
    
    for (let col = 0; col < cols; col++) {
      const value = tableData[row][col];
      
      if (value === currentValue) {
        // Found consecutive cell with same value, increment colspan
        colspan++;
        if (col === cols - 1) {
          // Last column, apply the span for the final group
          processedData[row][startCol] = { value: currentValue, rowspan: 1, colspan };
        }
      } else {
        if (currentValue !== null) {
          // Different value found, apply the span for the previous group
          processedData[row][startCol] = { value: currentValue, rowspan: 1, colspan };
        }
        // Start tracking new value
        currentValue = value;
        colspan = 1;
        startCol = col;
      }
    }
  }
  
  return processedData;
}

/**
 * Decorates a table block by analyzing and grouping consecutive cells with same content
 * The function:
 * 1. Collects all cell values from the table
 * 2. Analyzes the data to find groups of cells with same content
 * 3. Creates a new table structure with appropriate rowspan/colspan attributes
 * 
 * @param {Element} block - The table block element to decorate
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');
  
  // First, collect all cell values from the table
  // This creates a 2D array of cell contents for analysis
  const tableData = [...block.children].map(row => 
    [...row.children].map(cell => cell.textContent.trim())
  );
  
  // Analyze the table data to find groups of cells with same content
  // This will identify where rowspan and colspan should be applied
  const processedData = analyzeTableData(tableData);
  
  // Create the table structure with the identified spans
  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    
    [...row.children].forEach((cell, j) => {
      const cellData = processedData[i][j];
      if (!cellData) return; // Skip if this cell is part of a span
      
      const td = document.createElement(i === 0 && header ? 'th' : 'td');
      if (i === 0) td.setAttribute('scope', 'column');
      
      // Apply the identified spans to the cell
      // This will create the visual grouping of cells with same content
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
