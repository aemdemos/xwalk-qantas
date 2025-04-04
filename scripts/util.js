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
 * Format date from ISO string to readable format "9th March 2025 at 9:00"
 * @param {string} dateString - The date string to forma
 * @return {string} - Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';

  // Normalize the date string format if needed
  // Handle case where hour doesn't have leading zero (8:30 instead of 08:30)
  let normalizedDateString = dateString;
  if (dateString.match(/T\d:\d/)) {
    // Find position of T and insert a 0 after it if needed
    const tPos = dateString.indexOf('T');
    if (tPos > 0) {
      normalizedDateString = `${dateString.substring(0, tPos + 1)}0${dateString.substring(tPos + 1)}`;
    }
  }

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

  // Get time
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  // Create the formatted date string
  return `${day}${ordinalSuffix} ${month} ${year} at ${hours}:${formattedMinutes}`;
}
