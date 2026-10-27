/**
 * Converts array of objects into CSV format
 */
const jsonToCsv = (items) => {
  if (!items || items.length === 0) return '';

  const headers = Object.keys(items[0]);
  const headerRow = headers.join(',');

  const rows = items.map(item => {
    return headers.map(header => {
      let val = item[header];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') val = JSON.stringify(val);
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
  });

  return [headerRow, ...rows].join('\r\n');
};

module.exports = {
  jsonToCsv
};
