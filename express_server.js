const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const users = { abcdef: {
  id: "abcdef",
  email: "asdf@gmail.com",
  password: "asdf"
}};
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  let user = users[req.cookies.user_id];
  const templateVars = { user }
  res.render("urls_new", templateVars);
})

app.post("/urls", (req, res) => {
  let urlID = generateRandomString();
  urlDatabase[urlID] = req.body.longURL;
  res.redirect(`/urls/${urlID}`);
})

app.get("/urls/:shortURL", (req, res) => {
  let user = users[req.cookies.user_id];
  if (urlDatabase[req.params.shortURL]){
    const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user};
    res.render("urls_show", templateVars);
  }
  res.render("urls_noindex", { user })
})

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.body.shortURL] = req.body.editedURL;
  res.redirect("/urls")
})

app.get("/urls", (req, res) => {
  let user = users[req.cookies.user_id];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
})


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/u/:shortURL", (req, res) => { 
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
})

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`)
})

app.post("/login", (req, res) => {
  let id = req.body.username;
  res.cookie("username", id);
  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  let id = req.body.username;
  res.clearCookie("username");
  res.redirect("/urls");
})

app.get("/register", (req, res) => {
  let user = users[req.cookies.user_id];
  res.render("urls_register", { user })
})

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  let userEmail = req.body.email; 
  let userPassword = req.body.password;
  if ((userID === "" || userEmail === "") || userEmailLookup(userEmail)) {
    res.sendStatus(400);
  }
  users[userID] = { id:userID, email: userEmail, password: userPassword};
  res.cookie("user_id", userID);
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const userEmailLookup = function (email) {
  for(let user in users) {
    if(users[user]["email"] === email) {
      return users[user]["email"];
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
}