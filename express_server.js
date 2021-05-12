const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

const users = { abcdef: {
  id: "abcdef",
  email: "asdf@gmail.com",
  password: "asdf"
}};
const urlDatabase = {
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  let user = users[req.cookies.user_id];
  if(!user) {
    res.redirect("/login")
  }
  const templateVars = { user }
  res.render("urls_new", templateVars);
})

app.post("/urls", (req, res) => {
  let urlID = generateRandomString();
  urlDatabase[urlID] = { longURL:req.body.longURL, userID:req.cookies.user_id };
  res.redirect(`/urls/${urlID}`);
})

app.get("/urls/:shortURL", (req, res) => {
  let user = users[req.cookies.user_id];
  if(user) {
    if (urlDatabase[req.params.shortURL] && urlDatabase[req.params.shortURL]["userID"] === user["id"]){
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user};
      res.render("urls_show", templateVars);
    }
    res.redirect("urls_noperm")
  }
  res.render("urls_noperm", { user })
})

app.post("/urls/:id", (req, res) => {
  let user = users[req.cookies.user_id];
  if(user) {
    if (urlDatabase[req.params.id]["userID"] === user["id"]) {
      urlDatabase[req.body.shortURL] = req.body.editedURL;
    }
  }
  res.redirect("urls_noperm")
})

app.get("/urls", (req, res) => {
  let user = users[req.cookies.user_id];
  let filteredDB = {};
  if(user) {
    for (let url in urlDatabase) {
      if (urlDatabase[url]["userID"] === user["id"]) {
        filteredDB[url] = urlDatabase[url]
      }
    }
  }
  const templateVars = { urls: filteredDB, user };
  res.render("urls_index", templateVars);
})


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/u/:shortURL", (req, res) => { 
  const redirURL = req.params.shortURL;
  res.redirect(`https://${urlDatabase[redirURL]["longURL"]}`)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let user = users[req.cookies.user_id];
  if(user) {
    if (urlDatabase[req.params.id]["userID"] === user["id"]) {
      delete urlDatabase[req.params.shortURL];
    }
  }
  res.redirect("urls_noperm")
})

app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`)
})

app.post("/login", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (userEmailLookup(email)) {
    if(bcrypt.compareSync(password, userEmailLookup(email).password)) {
      res.cookie("user_id", userEmailLookup(email).id);
      res.redirect("/urls")
    }
  }
  res.sendStatus(403)
})

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
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
  users[userID] = { id:userID, email: userEmail, password: bcrypt.hashSync(userPassword, 10)};
  res.cookie("user_id", userID);
  res.redirect("/urls")
})

app.get("/login", (req, res) => {
  let user = users[req.cookies.user_id];
  let templateVars = { user }
  res.render("urls_login", templateVars)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const userEmailLookup = function (email) {
  for(let user in users) {
    if(users[user]["email"] === email) {
      return users[user];
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