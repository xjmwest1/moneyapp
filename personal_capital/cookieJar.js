let fs = require('fs');
let request = require('request');
let FileCookieStore = require('tough-cookie-filestore');

let cookiesFile = 'personal_capital/cookies.json';

function getJar() {
  return new Promise((resolve, reject) => {
    let jar = fs.existsSync(cookiesFile) ? 
      request.jar(new FileCookieStore(cookiesFile)) :
      request.jar();

    resolve(jar);
  });
}

module.exports = {
  getJar,
};