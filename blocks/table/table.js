/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Analyzes table data to find consecutive cells with same values
 * @param {Array<Array<string>>} tableData - 2D array of cell values
 * @returns {Array<Array<{value: string, rowspan: number, colspan: number}>>} - Processed table data with spans
 */
function analyzeTableData(tableData) {
  const rows = tableData.length;
  const cols = tableData[0].length;
  const processedData = Array(rows).fill().map(() => Array(cols).fill(null));
  
  // Process rows for rowspan
  for (let col = 0; col < cols; col++) {
    let currentValue = null;
    let rowspan = 1;
    let startRow = 0;
    
    for (let row = 0; row < rows; row++) {
      const value = tableData[row][col];
      
      if (value === currentValue) {
        rowspan++;
        if (row === rows - 1) {
          // Last row, apply the span
          processedData[startRow][col] = { value: currentValue, rowspan, colspan: 1 };
        }
      } else {
        if (currentValue !== null) {
          // Apply the span for previous value
          processedData[startRow][col] = { value: currentValue, rowspan, colspan: 1 };
        }
        currentValue = value;
        rowspan = 1;
        startRow = row;
      }
    }
  }
  
  // Process columns for colspan
  for (let row = 0; row < rows; row++) {
    let currentValue = null;
    let colspan = 1;
    let startCol = 0;
    
    for (let col = 0; col < cols; col++) {
      const value = tableData[row][col];
      
      if (value === currentValue) {
        colspan++;
        if (col === cols - 1) {
          // Last column, apply the span
          processedData[row][startCol] = { value: currentValue, rowspan: 1, colspan };
        }
      } else {
        if (currentValue !== null) {
          // Apply the span for previous value
          processedData[row][startCol] = { value: currentValue, rowspan: 1, colspan };
        }
        currentValue = value;
        colspan = 1;
        startCol = col;
      }
    }
  }
  
  return processedData;
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');
  
  // First, collect all cell values
  const tableData = [...block.children].map(row => 
    [...row.children].map(cell => cell.textContent.trim())
  );
  
  // Analyze the table data for spans
  const processedData = analyzeTableData(tableData);
  
  // Create the table structure
  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    
    [...row.children].forEach((cell, j) => {
      const cellData = processedData[i][j];
      if (!cellData) return; // Skip if this cell is part of a span
      
      const td = document.createElement(i === 0 && header ? 'th' : 'td');
      if (i === 0) td.setAttribute('scope', 'column');
      
      // Apply spans if they exist
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
