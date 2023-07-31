const express = require("express");
const fs = require("fs");
const app = express();
var session = require("express-session");
app.set("view engine", "ejs");
app.use(
  session({
    secret: "WEDONTTELLTHATHERE",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/style.css", function (req, res) {
  res.sendFile(__dirname + "/style.css");
});
app.get("/", (req, res) => {
  res.render("login.ejs", { message: null });
});
app.get("/dashboard", function (req, res) {
  if (!req.session.isLoggedIn) {
    res.redirect("/");
    return;
  }
  res.render("dashboard.ejs", {
    username: req.session.username,
    email: req.session.email,
  });
  // res.sendFile(__dirname + "/dashboard.html");
});

//login
app.post("/login", function (req, res) {
  if (req.body.email.trim() !== "" && req.body.password.trim() !== "") {
    const email = req.body.email;
    const password = req.body.password;
    readAllUsers(function (err, data) {
      if (err) {
        res.status(500).send("Error reading file");
        return;
      }
      const user = data.find(
        (d) => d.email === email && d.password === password
      );
      if (user) {
        req.session.isLoggedIn = true;
        req.session.username = user.username;
        req.session.email = user.email;
        //redirect to dashboard
        res.redirect("/dashboard");
        return;
      }
      res.redirect("/invalid");
    });
  } else {
    //("All fields are required");
    let message = "All fields are required";
    res.render("login.ejs", {
      message,
    });
  }
});
app.get("/invalid", function (req, res) {
  res.render("invalid.ejs");
});

app.get("/register", (req, res) => {
  if (req.session.isLoggedIn === true) {
    res.redirect("/");
  } else {
    res.render("register.ejs", { message: "" });
  }
});

//new account
app.post("/create_account", function (req, res) {
  if (
    req.body.username.trim() !== "" &&
    req.body.email.trim() !== "" &&
    req.body.password.trim() !== ""
  ) {
    const userObj = {
      username: req.body.username.trim(),
      email: req.body.email.trim().toLowerCase(),
      password: req.body.password.trim(),
    };
    readAllUsers(function (err, data) {
      if (err) {
        res.status(500).send("error");
        return;
      }
      for (let user of data) {
        if (user.email === req.body.email.toLowerCase()) {
          // res.send(
          //   `<h2> User Already Exist</h2><div><div><a href="/" style="text-decoration:none">Click Here to Login</a></div></div>`
          // );
          let message = "User Already Exists! Try Login";
          res.render("register", {
            message,
          });
          return;
        }
      }
      data.push(userObj);
      saveUserInFile(data, function (err) {
        if (err) {
          res.status(500).send("error");
          return;
        }
        //redirect to login
        res.redirect("/");
      });
    });
  } else {
    //("All fields are required");
    let message = "All fields are required";
    res.render("register", {
      message,
    });
  }
});
app.get("/logout", function (req, res) {
  // Clear the session
  req.session.isLoggedIn = false;
  req.session.username = null;

  // Redirect to the login page
  res.redirect("/");
});
app.listen(3000, () => {
  console.log("server is running on port 3000");
});

function readAllUsers(callback) {
  fs.readFile("./users.json", "utf-8", function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    if (data.length === 0) {
      data = "[]";
    }

    try {
      data = JSON.parse(data);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}
function saveUserInFile(user, callback) {
  fs.writeFile("./users.json", JSON.stringify(user), function (err) {
    if (err) {
      callback(err);
      return;
    }

    callback(null);
  });
}
