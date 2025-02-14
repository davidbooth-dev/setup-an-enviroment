"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const mongo = require("mongodb").MongoClient;

const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");

const sessionStore = new session.MemoryStore();
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

const http = require("http").Server(app);
const io = require("socket.io")(http);

app.use(cors());

const auth = require("./app/auth.js");
const routes = require("./app/routes.js");

fccTesting(app); //For FCC testing purposes

app.use("/public", express.static(process.cwd() + "/public"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    key: "express.sid",
    store: sessionStore
  })
);

const dboptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

let db;

// Setup database
mongo.connect(process.env.MONGO_URI, dboptions, (err, client) => {
  if (err) {
    console.log("Database error: " + err);
  } else {
    console.log("Successful database connection");
    db = client.db("nodedb");

    auth(app, db);
    routes(app, db);

    http.listen(process.env.PORT || 3000);

    //start socket.io code
    io.use(
      passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: "express.sid",
        secret: process.env.SESSION_SECRET,
        store: sessionStore
      })
    );

    let currentUsers = 0;

    io.on("connect", socket => {
      console.log("A user has connected");
      ++currentUsers;
      io.emit("user", {
        name: socket.request.user.name,
        currentUsers,
        connected: true
      });

      socket.on("chat message", message => {
        io.emit("chat message", { name: socket.request.user.name, message: message });
      });
      
      socket.on("disconnect", () => {
        console.log("A user has disconnected");
        --currentUsers;
        io.emit("user", {
          name: socket.request.user.name,
          currentUsers,
          connected: false
        });
      });
    });
    //end socket.io code
  }
});
