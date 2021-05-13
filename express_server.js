const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const getUserByEmail = require("./helpers");
const methodOverride = require('method-override');

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ["test"],
}));

app.set('view engine', 'ejs');

const users = { abcdef: {
  id: "abcdef",
  email: "asdf@gmail.com",
  password: "asdf"
}};

const urlDatabase = {};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.post("/urls", (req, res) => {
  let urlID = generateRandomString();
  urlDatabase[urlID] = { longURL:req.body.longURL, userID:req.session.user_id, visitCount: 0, uniqueVisitors: {}, visits: [] };
  res.redirect(`/urls/${urlID}`);
});

app.get("/urls", (req, res) => {
  let user = users[req.session.user_id];
  let filteredDB = {};
  if (user) {
    for (let url in urlDatabase) {
      if (urlDatabase[url]["userID"] === user["id"]) {
        filteredDB[url] = urlDatabase[url];
      }
    }
  }
  const templateVars = { urls: filteredDB, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    if (urlDatabase[req.params.shortURL] && urlDatabase[req.params.shortURL]["userID"] === user["id"]) {
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], visitCount: urlDatabase[req.params.shortURL]["visitCount"], uniqueVisitors: urlDatabase[req.params.shortURL]["uniqueVisitors"], visits: urlDatabase[req.params.shortURL]["visits"], user};
      res.render("urls_show", templateVars);
    }
    res.redirect("/noperms");
  }
  res.redirect("/noperms");
});

app.put("/urls/:id", (req, res) => {
  let user = req.session.user_id;
  if (user) {
    if (urlDatabase[req.body.shortURL]["userID"] === user) {
      urlDatabase[req.body.shortURL]["longURL"] = req.body.editedURL;
      res.redirect(`/urls/${req.body.shortURL}`);
    }
  }
  res.redirect("/noperms");
});

app.put("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    if (urlDatabase[req.params.shortURL]["userID"] === user["id"]) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/");
    }
  }
  res.redirect("/noperms");
});

app.get("/u/:shortURL", (req, res) => {
  const redirURL = req.params.shortURL;
  if (urlDatabase[redirURL]) {
    urlDatabase[redirURL]["visitCount"] += 1;
    if (!urlDatabase[redirURL]["uniqueVisitors"][req.session.user_id]) {
      urlDatabase[redirURL]["uniqueVisitors"][req.session.user_id] = req.session.user_id;
    }
    urlDatabase[redirURL]["visits"].push([Date(Date.now()), generateRandomString()]);
    res.redirect(`https://${urlDatabase[redirURL]["longURL"]}`);
  }
  res.redirect("/noindex");
});

app.get("/noindex", (req, res) => {
  let user = users[req.session.user_id];
  res.render("urls_noindex", { user });
});

app.get("/noperms", (req, res) => {
  let user = users[req.session.user_id];
  res.render("urls_noperm", { user });
});

app.get("/register", (req, res) => {
  let user = users[req.session.user_id];
  res.render("urls_register", { user });
});

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  let userEmail = req.body.email;
  let userPassword = req.body.password;
  if ((userID === "" || userEmail === "") || getUserByEmail(userEmail, users)) {
    res.sendStatus(400);
  }
  users[userID] = { id:userID, email: userEmail, password: bcrypt.hashSync(userPassword, 10)};
  req.session.user_id = userID;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (getUserByEmail(email, users)) {
    if (bcrypt.compareSync(password, getUserByEmail(email, users).password)) {
      req.session.user_id = getUserByEmail(email, users).id;
      res.redirect("/urls");
    }
  }
  res.sendStatus(403);
});

app.get("/login", (req, res) => {
  let user = users[req.session.user_id];
  let templateVars = { user };
  res.render("urls_login", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const generateRandomString = function() {
  let rdmStr = "";
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charLength = chars.length;
  for (let i = 0; i < 6; i++) {
    rdmStr += chars.charAt(Math.floor(Math.random() * charLength));
  }
  return rdmStr;
};

