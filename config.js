//Empty object on which you can set up your conrigurable options
var cfg = {

  // Try to default from process.env:
  // http://nodejs.org/api/process.html#process_process_env
  port : process.env.PORT || 8000,

  apiEndpoint: process.env.API_ENDPOINT || 'http://osdi.ngpvan.com/api/v1/',
  vanEndpoint: process.env.VAN_ENDPOINT || 'https://api.securevan.com/v4/',
  defaultVanPageSize: 50,
  requireHttps: process.env.REQUIRE_HTTPS || false

};

module.exports = {
  get: function (varName) {
    if (cfg.hasOwnProperty(varName)) {
      return cfg[varName];
    } else {
      throw new Error('Config value not found: ' + varName);
    }
  }
};
