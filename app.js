const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cron = require("node-cron");
const cors = require("cors");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

//database connection

const mongourl =
  "mongodb+srv://vishnuproject123:hBqELjOP2NFEj7Fa@cluster0.01cum.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mongourl)
  .then(() => {
    console.log("Database Connnected");
  })
  .catch((err) => {
    console.error(err);
  });
require("./Schemas/UserDetails");

const authRoutes = require("./Routes/Authroutes");

app.get("/", (req, res) => {
  res.send({ status: "started" });
});

//User Authentication Routes

app.post("/login-user", authRoutes);
app.post("/register", authRoutes);
app.post("/forgotpass", authRoutes);
app.post("/resetpass", authRoutes);
app.post("/userdata", authRoutes);
app.post("/change-password", authRoutes);
app.post("/upload-profile-image", authRoutes);
app.use("/uploads", authRoutes);

app.listen(5000, () => {
  console.log("Node js server started.");
});
