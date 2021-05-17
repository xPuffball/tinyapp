//importing npm packages
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const helpers = require("./helpers");
const generateRandomString = helpers.generateRandomString;
const getUserByEmail = helpers.getUserByEmail;
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ["test"],
}));

app.set('view engine', 'ejs');

//users object stores information of every user as an object
const users = { abcdef: {
  id: "abcdef",
  email: "asdf@gmail.com",
  password: "asdf"
}};

//database stores all urls that have been created
const urlDatabase = {};

const permError = "You don't have permission to access this page!";
const indexError = "This index does not exist!!";

//root directory goes to /urls page unless logged out
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

//post request to add a url to urlDatabase & render it
app.post("/urls", (req, res) => {
  let urlID = generateRandomString();
  urlDatabase[urlID] = { longURL:req.body.longURL, userID:req.session.user_id, visitCount: 0, uniqueVisitors: {}, visits: [] };
  res.redirect(`/urls/${urlID}`);
});

//renders a table of urls in the urlDatabase
app.get("/urls", (req, res) => {
  let user = users[req.session.user_id];
  let filteredDB = {};
  if (user) { //checks the existence of a user cookie session (is the user signed in?)
    for (let url in urlDatabase) {
      if (urlDatabase[url]["userID"] === user["id"]) {
        filteredDB[url] = urlDatabase[url];
      }
    }
  }
  const templateVars = { urls: filteredDB, user };
  res.render("urls_index", templateVars);
});

//renders page for new url creation
app.get("/urls/new", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});

//rendering for individual custom url values
app.get("/urls/:shortURL", (req, res) => {
  //vars for user, url information
  const user = users[req.session.user_id];
  const { shortURL } = req.params;
  const longURL = urlDatabase[shortURL];
  const urlBelongsToUser = longURL["userID"] === user["id"]

  if (!user || !longURL || !urlBelongsToUser) { //user login & validation
    return res.redirect("/noperms");
  }

  const templateVars = { 
    user,
    shortURL, 
    longURL, 
    visitCount: longURL["visitCount"], 
    uniqueVisitors: longURL["uniqueVisitors"], 
    visits: longURL["visits"]
  };

  res.render("urls_show", templateVars);
});

//url modifier
app.put("/urls/:id", (req, res) => {
  let user = req.session.user_id;
  if (user) {
    //reassignment of variable in urlDatabase
    if (urlDatabase[req.body.shortURL]["userID"] === user) {
      urlDatabase[req.body.shortURL]["longURL"] = req.body.editedURL;
      res.redirect(`/urls/${req.body.shortURL}`);
    }
  }
  res.redirect(`/error/${permError}`);
});

//route for editing an existing url
app.put("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

//route for deleting an existing url
app.delete("/urls/:shortURL/delete", (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    if (urlDatabase[req.params.shortURL]["userID"] === user["id"]) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/");
    }
  }
  res.redirect(`/error/${permError}`);
});

//redirection for shorturl to longurl
app.get("/u/:shortURL", (req, res) => {
  const redirURL = req.params.shortURL;
  if (urlDatabase[redirURL]) { //checks for url existence in urlDatabase
    urlDatabase[redirURL]["visitCount"] += 1;
    if (!urlDatabase[redirURL]["uniqueVisitors"][req.session.user_id]) { //cookie tracking for unique visitors count
      urlDatabase[redirURL]["uniqueVisitors"][req.session.user_id] = req.session.user_id;
    }
    urlDatabase[redirURL]["visits"].push([Date(Date.now()), generateRandomString()]); //visitor id generation
    if (urlDatabase[redirURL]["longURL"].indexOf("https://") === -1) { //checks for existence of preceding https
      res.redirect(`https://${urlDatabase[redirURL]["longURL"]}`);
    } else {
      res.redirect(urlDatabase[redirURL]["longURL"]);
    }
  }
  res.redirect(`/error/${indexError}`);
});

//generic error redirection to be used in other routes
app.get("/error/:err", (req, res) => {
  let user = users[req.session.user_id];
  let err = req.params.err;
  res.render("urls_error", { user, err });
});

//renders register page
app.get("/register", (req, res) => {
  let user = users[req.session.user_id];
  res.render("urls_register", { user });
});

//post request for registering
app.post("/register", (req, res) => {
  let userID = generateRandomString(); //generating a user id
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  if ((userID === "" || userEmail === "") || getUserByEmail(userEmail, users)) { //check for email existence & return relevant error
    res.end("Email already exists!")
  }
  users[userID] = { id:userID, email: userEmail, password: bcrypt.hashSync(userPassword, 10)};
  req.session.user_id = userID;
  res.redirect("/urls");
});

//post request for login
app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (getUserByEmail(email, users)) {
    if (bcrypt.compareSync(password, getUserByEmail(email, users).password)) { //unhasing password
      req.session.user_id = getUserByEmail(email, users).id; //set current session to user logging in
      res.redirect("/urls");
    }
  }
  res.sendStatus(403);
});

//renders login page
app.get("/login", (req, res) => {
  let user = users[req.session.user_id];
  let templateVars = { user };
  res.render("urls_login", templateVars);
});

//post request for logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
