let login = require('./login');
let getUserTransactions = require('./getUserTransactions');

let loginThenApi = () => {
  return login().then(session => ({ 
    getUserTransactions: () => { return getUserTransactions(session); },
  }));
};

module.exports = {
  login: loginThenApi
};