let pc = require('./personal_capital');

pc.login().then(api => {
  api.getUserTransactions().then(transactions => {
    transactions.forEach(transaction => {
      console.log(Object.keys(transaction));
    });
  }); 
});