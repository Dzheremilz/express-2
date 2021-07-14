const express = require("express");
const app = express();
const fsPromises = require("fs/promises");
const cors = require("cors");

const IP_LOOPBACK = "localhost";
const IP_LOCAL = "172.31.103.30"; // my local ip on my network
const PORT = 3333;

const LOG_FILE = "access-log.txt";

// timer middleware
const timer = (req, res, next) => {
  const date = new Date();
  req.requestDate = date.toUTCString();
  next();
};

// logger middleware
const logger = async (req, res, next) => {
  try {
    const log = `${req.requestDate} ${req.method} "${req.originalUrl}" from ${req.ip} ${req.headers["user-agent"]}\n`;
    await fsPromises.appendFile(LOG_FILE, log, "utf-8");
  } catch (e) {
    console.error(`Error: can't write in ${LOG_FILE}`);
  } finally {
    next();
  }
};

// shower middleware
const shower = async (req, res, next) => {
  const log = `${req.requestDate} ${req.method} "${req.originalUrl}" from ${req.ip} ${req.headers["user-agent"]}`;
  console.log(log);
  next();
};

// Middleware for checking if user exists
const userChecker = async (req, res, next) => {
  const db_user = JSON.parse(
    await fsPromises.readFile("./users.json", "UTF-8")
  );
  const username = req.body.username;
  if (db_user.hasOwnProperty(username)) {
    next();
  } else {
    res.status(401).send("Username or password invalid.");
  }
};

// Middleware for checking if password is correct
const passwordChecker = async (req, res, next) => {
  const db_user = JSON.parse(
    await fsPromises.readFile("./users.json", "UTF-8")
  );
  // const username = req.body.username;
  // const password = req.body.password;
  const { username, password } = req.body;
  if (db_user[username] === password) {
    next();
  } else {
    res.status(401).send("Username or password invalid.");
  }
};

app.use(cors());
app.use(express.urlencoded({ extended: false })); // to support URL-encoded bodies
app.use(express.json()); // to support JSON-encoded bodies
app.use(timer);
app.use(logger);
app.use(shower);

// login
app.use("/login", userChecker);
app.use("/login", passwordChecker);

app.get("/hello", (req, res) => {
  res.send(`Hello ${req.ip}`);
});

app.get("/bye", (req, res) => {
  res.send(`Goodbye ${req.ip}`);
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  res.send(`Welcome to your dashboard ${username}`);
});

app.listen(PORT, IP_LOCAL, () => {
  //exécution d'un affichage au lacement du serveur.
  console.log(`Example app listening at http://${IP_LOCAL}:${PORT}`);
});
