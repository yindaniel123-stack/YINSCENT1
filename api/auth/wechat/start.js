module.exports = function handler(req, res) {
  res.statusCode = 302;
  res.setHeader("Location", "/login.html");
  res.end();
};
