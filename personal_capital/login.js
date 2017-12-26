let request = require('request');
let prompt = require('prompt');
let cookieJar = require('./cookieJar');
let { username, password } = require('./credentials');

let deviceName = 'moneyApp';
let csrfRegexp = /globals.csrf='([a-f0-9-]+)'/;
let loggedInCsrfRegexp = /var csrf = '([a-f0-9-]+)'/;

function getHomepageCSRF(jar) {
  let requestOptions = {
    method: 'GET',
    url: 'https://home.personalcapital.com',
    jar,
  };

  return new Promise((resolve, reject) => {
    request(requestOptions, (error, response, body) => {
      let result = csrfRegexp.exec(body);

      if (result == null) {
        result = loggedInCsrfRegexp.exec(body);
        let csrf = result[1];
        reject({
          csrf,
          jar,
        });
        return;
      }

      let csrf = result[1];
      resolve({
        csrf,
        jar,
      });
    });
  }); 
}

function identifyUser(session) {
  let { csrf, jar } = session;

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
      let newCsrf = JSON.parse(body).spHeader.csrf;
      resolve({
        csrf: newCsrf,
        jar,
      });
    });
  });
}

function smsChallenge(session) {
  let { csrf, jar } = session;

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
      resolve(session);
    });
  });
}

function promptSmsCode(session) {
  let { csrf, jar } = session;
  
  prompt.start();
  return new Promise((resolve, reject) => {
    prompt.get([{
      name: 'code',
      type: 'number',
    }], (err, result) => {
      resolve({
        jar,
        code: result.code,
        csrf,
      });
    });
  });
}

function smsAuthenticate(session) {
  let { csrf, jar, code } = session;

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
      resolve({
        csrf,
        jar,
      });
    });
  });
}

function authenticatePassword(session) {
  let { csrf, jar } = session;

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
      resolve({
        csrf,
        jar
      });
    });
  });
}

function login() {
  return cookieJar.getJar()
    .then(getHomepageCSRF)
    .then(identifyUser)
    .then(smsChallenge)
    .then(promptSmsCode)
    .then(smsAuthenticate)
    .then(authenticatePassword)
    .then(session => {
      console.log('logged in successfully');
      return session;
    })
    .catch(session => {
      console.log('logged in successfully using stored session');
      return Promise.resolve(session)
    });
}

module.exports = login;
