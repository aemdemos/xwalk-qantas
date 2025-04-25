 /**
 * Helper function to get ordinal suffix for day numbers
 * @param {number} day - The day number
 * @return {string} - The appropriate ordinal suffix
 */
export function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Normalizes ISO date strings to ensure they have valid format with leading zeros
 * @param {string} dateString - The date string to normalize
 * @return {string} - Normalized date string
 */
export function normalizeISODateString(dateString) {
  if (!dateString) return '';

  // Handle case where hour doesn't have leading zero (T9: instead of T09:)
  if (dateString.match(/T\d:/)) {
    // Find position of T and insert a 0 after it if needed
    const tPos = dateString.indexOf('T');
    if (tPos > 0) {
      return `${dateString.substring(0, tPos + 1)}0${dateString.substring(tPos + 1)}`;
    }
  }
  return dateString;
}

/**
 * Sorts data by date in descending order (newest first)
 * @param {Array} data - Array of objects containing date fields
 * @param {string} [dateField1='publisheddate'] - Primary date field name
 * @param {string} [dateField2='publishDateTime'] - Secondary date field name
 * @return {Array} - Sorted array
 */
export function sortDataByDate(data, dateField1 = 'publisheddate', dateField2 = 'publishDateTime') {
  if (!data || !Array.isArray(data)) return [];

  return [...data].sort((a, b) => {
    const dateA = new Date(normalizeISODateString(a[dateField1] || a[dateField2]));
    const dateB = new Date(normalizeISODateString(b[dateField1] || b[dateField2]));
    return dateB - dateA; // Sort in descending order (newest first)
  });
}

/**
 * Internal helper function for date formatting
 * @param {string} dateString - The date string to format
 * @param {boolean} includeTime - Whether to include time in the output
 * @return {string} - Formatted date string
 */
function formatDateInternal(dateString, includeTime) {
  if (!dateString) return '';

  // Normalize the date string format using the utility function
  const normalizedDateString = normalizeISODateString(dateString);

  const date = new Date(normalizedDateString);
  if (Number.isNaN(date.getTime())) {
    console.error(`Invalid date format: ${dateString}`);
    return dateString;
  }

  // Get day with ordinal suffix
  const day = date.getDate();
  const ordinalSuffix = getOrdinalSuffix(day);

  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[date.getMonth()];

  // Get year
  const year = date.getFullYear();

  // Create the basic formatted date string
  let formatted = `${day}${ordinalSuffix} ${month} ${year}`;

  // Add time if requested
  if (includeTime) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    formatted += ` at ${hours}:${formattedMinutes}`;
  }

  return formatted;
}

/**
 * Format date from ISO string to readable format "9th March 2025 at 9:00"
 * @param {string} dateString - The date string to format
 * @return {string} - Formatted date string
 */
export function formatDate(dateString) {
  return formatDateInternal(dateString, true);
}

/**
 * Format date from ISO string to readable format without time "9th March 2025"
 * @param {string} dateString - The date string to format
 * @return {string} - Formatted date string without time
 */
export function formatDateNoTime(dateString) {
  return formatDateInternal(dateString, false);
}
