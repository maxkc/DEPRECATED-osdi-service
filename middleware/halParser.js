
module.exports = function (req, res, next) {
  try {
    var rawBody = req.body;
    var parsedBody = JSON.parse(rawBody);
    req.body = parsedBody;
  }
  catch (e) {
    console.trace('Exception while parsing body: ', req.body, e);
    req.body = {};
  }
  next();
};
