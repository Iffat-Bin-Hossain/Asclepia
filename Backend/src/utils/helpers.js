const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for an admin user
 * @param {string} id - Admin's MongoDB ObjectId
 * @returns {string} signed JWT
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Safely escape regex characters to prevent regex injection or syntax errors
 * (e.g. searching phone numbers with +, parenthesis, or special chars)
 */
const escapeRegex = (string = '') => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Build a paginated response object with normalized integer values
 */
const paginateResponse = (data, total, page, limit) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
  const totalPages = Math.max(1, Math.ceil(total / parsedLimit));

  return {
    data,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Parse a wide variety of date string formats from search boxes
 * Supports: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD,
 * YYYY-MM, Month YYYY, Month DD YYYY, etc.
 * Returns { start: Date, end: Date } or null if not a valid date query
 */
const parseDateSearchRange = (input) => {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  if (!s || s.length < 4) return null;

  // 1. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const d = parseInt(match[3], 10);
    const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    if (!isNaN(start.getTime())) return { start, end };
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const y = parseInt(match[3], 10);

    // Differentiate between DD/MM and MM/DD
    let d = p1;
    let m = p2 - 1;
    if (p1 > 12) {
      d = p1;
      m = p2 - 1;
    } else if (p2 > 12) {
      m = p1 - 1;
      d = p2;
    }

    const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
    if (!isNaN(start.getTime())) return { start, end };
  }

  // 3. YYYY-MM or YYYY/MM (month query)
  match = s.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    if (!isNaN(start.getTime())) return { start, end };
  }

  // 4. Natural language date like "October 2026", "Oct 5, 2026", "5 Oct 2026"
  const MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };

  // Check Month YYYY (e.g. "October 2026", "Oct 2026")
  let natMatch = s.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (natMatch && MONTHS[natMatch[1].toLowerCase()] !== undefined) {
    const mo = MONTHS[natMatch[1].toLowerCase()];
    const yr = parseInt(natMatch[2], 10);
    return {
      start: new Date(Date.UTC(yr, mo, 1, 0, 0, 0, 0)),
      end: new Date(Date.UTC(yr, mo + 1, 0, 23, 59, 59, 999)),
    };
  }

  // Check Month Day Year (e.g. "Oct 5, 2026", "October 5 2026", "Oct 05 2026")
  natMatch = s.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s*(\d{4})$/);
  if (natMatch && MONTHS[natMatch[1].toLowerCase()] !== undefined) {
    const mo = MONTHS[natMatch[1].toLowerCase()];
    const dy = parseInt(natMatch[2], 10);
    const yr = parseInt(natMatch[3], 10);
    const start = new Date(Date.UTC(yr, mo, dy, 0, 0, 0, 0));
    start.setUTCHours(start.getUTCHours() - 14);
    const end = new Date(Date.UTC(yr, mo, dy, 23, 59, 59, 999));
    end.setUTCHours(end.getUTCHours() + 14);
    return { start, end };
  }

  // Check Day Month Year (e.g. "5 Oct 2026", "5 October 2026")
  natMatch = s.match(/^(\d{1,2})\s+([a-zA-Z]+),?\s*(\d{4})$/);
  if (natMatch && MONTHS[natMatch[2].toLowerCase()] !== undefined) {
    const dy = parseInt(natMatch[1], 10);
    const mo = MONTHS[natMatch[2].toLowerCase()];
    const yr = parseInt(natMatch[3], 10);
    const start = new Date(Date.UTC(yr, mo, dy, 0, 0, 0, 0));
    start.setUTCHours(start.getUTCHours() - 14);
    const end = new Date(Date.UTC(yr, mo, dy, 23, 59, 59, 999));
    end.setUTCHours(end.getUTCHours() + 14);
    return { start, end };
  }

  return null;
};

module.exports = { generateToken, paginateResponse, escapeRegex, parseDateSearchRange };

