/**
 * Tiny RFC 4180 CSV writer.
 *
 * - Quotes fields that contain commas, quotes or line breaks.
 * - Neutralises spreadsheet formula injection (cells starting with = @ etc.).
 * - Prepends a UTF-8 BOM so Excel opens non-ASCII text correctly.
 */
function escapeCell(value) {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);

  // "+254 700..." and "-5" are fine; "+cmd|..." or "=SUM(..)" are not.
  if (/^[=@\t\r]/.test(s) || /^[+-](?![\d\s()-])/.test(s)) s = `'${s}`;

  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {object[]} rows
 * @param {{label: string, value: (row: object) => unknown}[]} columns
 */
function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCell(c.value(row))).join(",")
  );
  return "\uFEFF" + [header, ...lines].join("\r\n") + "\r\n";
}

function sendCsv(res, filename, csv) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(csv);
}

module.exports = { toCsv, sendCsv };
