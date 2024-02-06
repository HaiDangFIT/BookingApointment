const express = require('express');
const dbConnect = require('./config/dbconnect');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8888;

//connect database
dbConnect();

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.listen(port, () => {
  console.log("Server running on the port: " + port);
});