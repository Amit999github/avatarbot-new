const sanitizeHtml = require('sanitize-html');

const ListingSanitize = (req, res, next) => {
  for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitizeHtml(req.body[key], {
        allowedTags: [],
        allowedAttributes: {
          a: ['href', 'target'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
      });
    }
  }
  next();
};

module.exports = { ListingSanitize };
