
module.exports = function(req, res, next) {
  res.setHeader('Content-Type', 'application/hal+json');
  return next();
};

