const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
var ejs = require("ejs");
// import cookieParser from "cookie-parser";
var fetchuser = require("./middleware/fetchuser");
//jwt token
const bcrypt = require("bcryptjs");

// const { request } = require("http");

const jwt = require("jsonwebtoken");

const JWT_SECRET = "MY name is @mit";
// const validator=require("validator");

//file for localStorage
const localStorage = require("local-storage");

mongoose.set("strictQuery", true); // for strictquery warning

// app.set('view engine', 'html');
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/"));
app.engine("html", require("ejs").renderFile);
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true })); //body parser

const cors = require("cors");
app.use(express.json());
app.use(cors());

// connect with mongoose
const dbConnection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017", {
      //process.env.MONGO_URL
      dbname: "Reusedb",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("successfully connected");
  } catch (err) {
    console.log("NO connection");
    console.log(err);
  }
};
dbConnection();

// create schema
const userschema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userid: {
    type: String,
    required: true,
  },
  phoneno: {
    type: Number,
    unique: true,
    required: function () {
      return (this.phoneno.length = 10);
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
    required: true,
  },
});

//creating a model/ new collection
const usermodel = mongoose.model("user", userschema);

//jwt

//starting of get request
app.get("/", async function (req, res) {
  res.render("loginsignup.html");
});

app.get("/signup", async function (req, res) {
  res.render("signup.html");
});

app.post("/signup", async function (req, res) {
  console.log("signup api is called");
  try {
    const { name, userid, phoneno, email, Password } = req.body;

    // Check if the email or phone number already exists in the database
    const existingUser = await usermodel.findOne({
      $or: [{ email }, { phoneno }],
    });
    if (existingUser) {
      return res.status(400).send("Email or phone number already exists");
    }
    console.log("user not found in database");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const user = await usermodel.create({
      name,
      userid,
      phoneno,
      email,
      Password: hashedPassword,
    });
    console.log("user created in database");
    // Generate a JWT token
    const data = {
      user: {
        id: user.id,
      },
    };

    const authtoken = jwt.sign(data, JWT_SECRET);
    console.log("Token set");
    const sucess = true;
    res.send({ sucess, authtoken });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//autheticate a user
app.get("/Login", async function (req, res) {
  res.render("Login.html");
});

app.post("/Login", async function (req, res) {
  try {
    const phoneno = req.body.phoneno;
    const password = req.body.Password;

    const user = await usermodel.findOne({ phoneno: phoneno });

    if (user) {
      const passwordCompare = await bcrypt.compare(password, user.Password);

      if (!passwordCompare) {
        return res.status(400).send("<h1>Incorrect Password</h1>");
      } else {
        const data = {
          user: {
            id: user.id,
          },
        };

        const authtoken = jwt.sign(data, JWT_SECRET);
        const sucess = true;
        res.send({ sucess, authtoken }); // Store the token in a cookie
      }
    } else {
      return res.send("<h1>ID not found. Create a new account</h1>");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/home", function (req, res) {
  // const data =
  res.render("homepage.ejs");
});
app.post("/home", fetchuser, async function (req, res) {
  const products = await Productmodel.find();

  console.log("post request of home is called");
  res.send({ sucess: true , products });
});

app.post("/getuser", fetchuser, async (req, res) => {
  try {
    const userid = req.user.id;
    const user = await usermodel.findById(_id.userid).select("-Password");
    console.log(user.phoneno);
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

// create schema
const Communityschema = new mongoose.Schema({
  cumname: {
    type: String,
    required: true,
  },
  cumid: {
    type: String,
    required: true,
    unique: true,
  },
});

//creating a model/ new collection
const Communitymodel = mongoose.model("Community", Communityschema);

//starting of get request
app.get("/Community", async function (req, res) {
  res.render("loginsignup.html");
});

// create schema
// let count=0;
// var Schema = mongoose.Schema;
// var multer = require('multer');
const Productschema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  productname: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//creating a model/ new products
const Productmodel = mongoose.model("products", Productschema);

app.get("/Additems", async function (req, res) {
  res.render("Additems.html");
});

app.post("/Additems", fetchuser, async function (req, res) {
  try {
    const item1 = await Productmodel.create({
      user: req.user.id,
      productname: req.body.name,
      price: req.body.price,
      description: req.body.description,
      date: Date.now(),
    });
    console.log("data saved");
    // await item1.save();
    res.send("Data saved successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/myitems", async function (req, res) {
  res.render("Myitems.html");
});
app.post("/myitems", fetchuser, async function (req, res) {
  let Phoneno = req.body.phoneno;
  Productmodel.find({ phoneno: Phoneno })
    .then((x) => {
      res.render("Myitemslist.ejs", { x });
    })
    .catch((error) => {
      console.log(error);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
