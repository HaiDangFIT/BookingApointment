const express = require('express');
const dbConnect = require('./config/dbconnect');
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const initRoutes = require("./routes");

const app = express();
const port = process.env.PORT || 8888;

//connect database
dbConnect();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ['*'],
  })
);

app.use(express.json());

app.use(cookieParser());

app.use(express.json({ length: 52428800 }));

app.get("/", (req, res) => {
  res.send("Server is running...");
});

//routes
initRoutes(app);

app.listen(port, () => {
  console.log("Server running on the port: " + port);
});