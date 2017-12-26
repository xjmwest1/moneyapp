
let request = require('request');
let prompt = require('prompt');
let { username, password } = require('./credentials');

let jar = request.jar();
let csrf_regexp = /globals.csrf='([a-f0-9-]+)'/;

function getHomepageCSRF() {
  let requestOptions = {
    method: 'GET',
    url: 'https://home.personalcapital.com/page/login/goHome',
    jar,
  };

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      let result = csrf_regexp.exec(body);
      let csrf = result[1];
      console.log(csrf);
      resolve(csrf);
    });
  }); 
}

function identifyUser(csrf) {
  let data = {
    username,
    csrf,
    apiClient: 'WEB',
    bindDevice: false,
    skipLinkAccount: false,
    redirectTo: '',
    skipFirstUse: '',
    referrerId: '',
  };

  let requestOptions = {
    method: 'POST',
    url: 'https://home.personalcapital.com/api/login/identifyUser',
    form: data,
    jar,
  };

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      if (body.status_code == 200) {
        reject();
      } else {
        let newCsrf = JSON.parse(body).spHeader.csrf;
        console.log(newCsrf);
        resolve(newCsrf);
      }
    });
  });
}

function smsChallenge(csrf) {
  let data = {
    challengeReason: 'DEVICE_AUTH',
    challengeMethod: 'OP',
    challengeType: 'challengeSMS',
    apiClient: 'WEB',
    bindDevice: false,
    csrf,
  };

  let requestOptions = {
    method: 'POST',
    url: 'https://home.personalcapital.com/api/credential/challengeSms',
    form: data,
    jar,
  };

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      if (body.status_code == 200) {
        reject();
      } else {      
        resolve(csrf);
      }
    });
  });
}

function promptSmsCode(csrf) {
  prompt.start();
  return new Promise((resolve, reject) => {
    prompt.get([{
      name: 'code',
      type: 'number',
    }], (err, result) => {
      resolve({
        code: result.code,
        csrf,
      });
    });
  });
}

function smsAuthenticate(values) {
  let { csrf, code } = values;

  let data = {
    challengeReason: 'DEVICE_AUTH',
    challengeMethod: 'OP',
    apiClient: 'WEB',
    bindDevice: false,
    code,
    csrf,
  };

  let requestOptions = {
    method: 'POST',
    url: 'https://home.personalcapital.com/api/credential/authenticateSms',
    form: data,
    jar,
  };

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      if (body.status_code == 200) {
        reject();
      } else {      
        resolve(csrf);
      }
    });
  });
}

function authenticatePassword(csrf) {
  let data = {
    bindDevice: true,
    deviceName: '',
    redirectTo: '',
    skipFirstUse: '',
    skipLinkAccount: false,
    referrerId: '',
    passwd: password,
    apiClient: 'WEB',
    csrf,
  };
  
  let requestOptions = {
    method: 'POST',
    url: 'https://home.personalcapital.com/api/credential/authenticatePassword',
    form: data,
    jar,
  };

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      if (body.status_code == 200) {
        reject();
      } else {      
        resolve(csrf);
      }
    });
  });
}

function getUserTransactions(csrf) {
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
      if (body.status_code == 200) {
        reject();
      } else {
        JSON.parse(body).spData.transactions.forEach(transaction => {
          console.log(transaction.description);
        }); 
        resolve();
      }
    });
  }); 
}

getHomepageCSRF()
  .then(identifyUser)
  .then(smsChallenge)
  .then(promptSmsCode)
  .then(smsAuthenticate)
  .then(authenticatePassword)
  .then(getUserTransactions);