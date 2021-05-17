const getUserByEmail = function (email, database) {
  for(let user in database) {
    if(database[user]["email"] === email) {
      return database[user];
    }
  }
  return undefined;
}

const generateRandomString = function() {
  let rdmStr = "";
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charLength = chars.length;
  for (let i = 0; i < 6; i++) {
    rdmStr += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return rdmStr;
};

module.exports = { getUserByEmail, generateRandomString };