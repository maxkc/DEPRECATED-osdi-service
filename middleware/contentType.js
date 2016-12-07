
module.exports = function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  return next();
};

