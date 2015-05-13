//Empty object on which you can set up your conrigurable options
var cfg = {
  
  // Try to default from process.env:
  // http://nodejs.org/api/process.html#process_process_env
  port : process.env.PORT || 8000,
  
  apiEndpoint: 'https://ngpvan-osdi-service.herokuapp.com/api/v1/',
  vanEndpoint: 'https://api.securevan.com/v4/'

};

module.exports = {
  get: function (varName) {
    if (cfg[varName]) {
      return cfg[varName];
    }
    else {
      return '';
    }
  }
};
