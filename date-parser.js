(function installVisaDateParser(global) {
  const MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
  };

  function validDate(year, month, day) {
    const date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
  }

  function parseDateText(input, dateOrder = "mdy") {
    const text = String(input || "").replace(/[,|]/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return null;
    let match = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
    if (match) return validDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    match = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
    if (match) {
      const first = Number(match[1]), second = Number(match[2]);
      const month = dateOrder === "dmy" ? second : first;
      const day = dateOrder === "dmy" ? first : second;
      return validDate(Number(match[3]), month - 1, day);
    }

    match = text.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\s+(20\d{2})\b/i);
    if (match && MONTHS[match[1].toLowerCase()] !== undefined) return validDate(Number(match[3]), MONTHS[match[1].toLowerCase()], Number(match[2]));
    match = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(20\d{2})\b/i);
    if (match && MONTHS[match[2].toLowerCase()] !== undefined) return validDate(Number(match[3]), MONTHS[match[2].toLowerCase()], Number(match[1]));
    match = text.match(/\b([A-Za-z]{3,9})\s+(20\d{2})\s+(\d{1,2})\b/i);
    if (match && MONTHS[match[1].toLowerCase()] !== undefined) return validDate(Number(match[2]), MONTHS[match[1].toLowerCase()], Number(match[3]));
    return null;
  }

  function parseCalendarDay(dayText, headerText) {
    const day = Number(String(dayText || "").trim());
    if (!Number.isInteger(day) || day < 1 || day > 31) return null;
    const header = String(headerText || "").replace(/[,|]/g, " ").replace(/\s+/g, " ");
    const match = header.match(/\b([A-Za-z]{3,9})\s+(20\d{2})\b/i);
    if (!match || MONTHS[match[1].toLowerCase()] === undefined) return null;
    return validDate(Number(match[2]), MONTHS[match[1].toLowerCase()], day);
  }

  function dayKey(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  const api = { parseDateText, parseCalendarDay, dayKey };
  global.VisaDateParser = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
