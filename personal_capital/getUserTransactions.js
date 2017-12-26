let request = require('request');

function getUserTransactions(session) {
  let { csrf, jar } = session;

  let data = {
    lastServerChangeId: -1,
    csrf,
    apiClient: 'WEB'
  };
  
  let requestOptions = {
    method: 'POST',
    url: 'https://home.personalcapital.com/api/transaction/getUserTransactions',
    form: data,
    jar,
  };

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      let transactions = JSON.parse(body).spData.transactions;
      resolve(transactions);
    });
  }); 
}

module.exports = getUserTransactions;
