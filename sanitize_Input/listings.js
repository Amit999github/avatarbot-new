const sanitizeHtml = require('sanitize-html');


const roomListingSanitize = (req , res, next) => {
   for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = sanitizeHtml(req.body[key], {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'br'],
        allowedAttributes: {
          'a': ['href', 'target']
        },
        allowedSchemes: ['http', 'https', 'mailto']
      });
    }
  }
  next();
}


module.exports = {roomListingSanitize};