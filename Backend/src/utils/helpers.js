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

module.exports = { generateToken, paginateResponse, escapeRegex };

