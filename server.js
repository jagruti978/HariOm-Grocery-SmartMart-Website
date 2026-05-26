require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const session = require("express-session");
const customerRoutes = require("./routes/customer.routes");
const wholesalerRoutes = require("./routes/wholesaler.routes");
const chatRoutes = require("./routes/chat.routes");
const db = require("./config/db");
const app = express();


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    name: "hariom-session",
    secret: "hariom_smartmart_secret_key",
    resave: false,
    saveUninitialized: false,   
    cookie: { 
      maxAge: 1000 * 60 * 60,  
      sameSite: "lax"          
    }
  })
);

app.use("/api/auth", authRoutes);
app.use(dashboardRoutes);
app.use("/admin", require("./routes/admin.routes"));
app.use("/uploads", express.static("uploads"));
app.use("/customer", customerRoutes);
app.use("/wholesaler", wholesalerRoutes);
app.use(chatRoutes);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("pages/index");
});

app.get("/about", (req, res) => {
  res.render("pages/about");
});

app.get("/contact", (req, res) => {
  res.render("pages/contact");
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.get("/signup", (req, res) => {
  res.render("pages/signup");
});



const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
