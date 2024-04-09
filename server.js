// Name: Pratham Hemangbhai Pathak
// Student ID: 161688213
// Email: ppathak5@myseneca.ca


const express = require("express");
const fs = require("fs");
const hbs = require("hbs");
const exphbs = require("express-handlebars");
const path = require("path");
const linebyline = require("linebyline");
const emailValidator = require("email-validator");
const session = require("express-session");
const mongoose = require('mongoose');
const Image = require('./image_schema');
const orderPurchaseRouter = require('./order_purchase');


const app = express();
const PORT = process.env.PORT || 3000;

const handlebars = exphbs.create({
  defaultLayout: "main",
  extname: ".hbs",
  layoutsDir: path.join(__dirname, "views/layouts"),
  partialsDir: path.join(__dirname, "views/partials"),
  helpers: hbs.helpers,
});

app.use(
  session({
    secret: "tx3:Jf0=e?B6#@,4KKuQ/>iVABtEz9",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(express.urlencoded({ extended: true }));

hbs.registerPartials(path.join(__dirname, "views/partials"));
app.engine(".hbs", handlebars.engine);
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views/layouts"));

app.use(express.static(path.join(__dirname, "public")));

// mongo connection

mongoose.connect('mongodb+srv://thestrangermax:96lNX8SQQP7ziyc0@cluster0.inczrdi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});



function isLoggedIn(req, res, next) {
  if (req.session.email) {
    next();
  } else {
    res.redirect("/login");
  }
}

function ifLoggedIn(req, res, view) {
  if (req.session.email) {
    res.redirect("/");
  } else {
    res.render(view, { title: view });
  }
}

// Load user data
const usersData = JSON.parse(fs.readFileSync("user.json"));

class User {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.userExists = this.email in usersData;
  }

  addUser() {
    if (this.userExists) {
      console.log("User already exists");
      return false;
    } else {
      usersData[this.email] = this.password;
      fs.writeFileSync("user.json", JSON.stringify(usersData));
      return true;
    }
  }

  removeUser() {
    if (this.userExists) {
      delete usersData[this.email];
      fs.writeFileSync("user.json", JSON.stringify(usersData));
      return true;
    } else {
      return false;
    }
  }

  confirmPassword() {
    if (this.userExists) {
      return this.password == usersData[this.email];
    }
    return false;
  }
}

// Route to the home page
app.get('/', isLoggedIn, (req, res) => {
  Image.find({ status: 'A' }).lean() 
    .then(images => {
      if (images.length === 0) { // Check for an empty array
        console.log('No available images found');
        res.render('index', { images: [], message: 'No images available', email: req.session.email });
      } else {
        res.render('index', { images, email: req.session.email });
      }
    })
    .catch(err => {
      console.error('Error fetching images:', err);
      res.status(500).send('Internal Server Error'); 
    });
});

app.post("/", (req, res) => {
  isLoggedIn(req, res, () => {
    const imageNames = [];
    displayImage = { image: "img/default.webp", name: "Default" };
    const lineReader = linebyline(path.join(__dirname, "imageList.txt"));

    lineReader.on("line", (line) => {
      const [name, image] = line.split(",").map((item) => item.trim());
      imageNames.push(name);
      if (name == req.body.image) {
        displayImage.image = "img/" + image;
        displayImage.name = name;
      }
    });

    lineReader.on("end", () => {
      res.render("index", {
        imageNames: imageNames,
        displayImage: displayImage,
        title: "Home",
        email: req.session.email,
      });
    });
  });
});

app.use('/order', orderPurchaseRouter);

// Routes to signup
app.get("/signup", (req, res) => {
  ifLoggedIn(req, res, "signup");
});

app.post("/signup", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Validate email and password
  if (!email || !password) {
    return res.render("signup", { errorMessage: "Email and password are required." });
  }

  if (!emailValidator.validate(email)) {
    return res.render("signup", { errorMessage: "Invalid email address." });
  }

  if (password.length < 6) {
    return res.render("signup", { errorMessage: "Password must be at least 6 characters long." });
  }

  const user = new User(email, password);
  if (user.addUser()) {
    req.session.email = user.email;
    res.redirect("/");
  } else {
    res.render("signup", { errorMessage: "User already exists." });
  }
});

// Route to the login
app.get("/login", (req, res) => {
  ifLoggedIn(req, res, "login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Validate email and password
  if (!email || !password) {
    return res.render("login", { errorMessage: "Email and password are required." });
  }

  if (!emailValidator.validate(email)) {
    return res.render("login", { errorMessage: "Invalid email address." });
  }

  const user = new User(email, password);

  if (user.confirmPassword()) {
    // Initialize status values of all documents to 'A' (available)
    Image.updateMany({}, { status: 'A' })
      .then(() => {
        req.session.email = user.email;
        res.redirect("/");
      })
      .catch(err => {
        console.error('Error initializing status values:', err);
        res.status(500).send('Internal Server Error');
      });
  } else {
    res.render("login", { errorMessage: "Incorrect email or password." });
  }
});

// Route to the logout
app.get("/logout", (req, res) => {
  
  req.session.destroy((err) => {
    if (err) {
      
      console.log("Error destroying session:", err);
      res.status(500).send("Error destroying session");
    } else {
      res.redirect("/");
    }
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
