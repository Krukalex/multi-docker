// Load environment variables
const keys = require("./keys");

// Express app setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres client setup
const { Pool } = require("pg");

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
  ssl:
    process.env.NODE_ENV !== "production"
      ? false
      : { rejectUnauthorized: false },
});

// Ensure table exists
pgClient
  .query("CREATE TABLE IF NOT EXISTS values (number INT)")
  .catch((err) => console.error("Error creating table:", err));

// Redis client setup
const redis = require("redis");

const redisClient = redis.createClient({
  socket: {
    host: keys.redisHost,
    port: keys.redisPort,
  },
});

let redisPublisher; // Will be initialized in the async block

// Route handlers
app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  try {
    const values = await pgClient.query("SELECT * FROM values");
    res.send(values.rows);
  } catch (err) {
    console.error("Error fetching values from PG:", err);
    res.status(500).send("Error fetching values");
  }
});

app.get("/values/current", async (req, res) => {
  try {
    const values = await redisClient.hGetAll("values");
    res.send(values);
  } catch (err) {
    console.error("Error fetching current values from Redis:", err);
    res.status(500).send("Error fetching current values");
  }
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  try {
    await redisClient.hSet("values", index, "Nothing yet!");
    await redisPublisher.publish("insert", index);
    await pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
    res.send({ working: true });
  } catch (err) {
    console.error("Error inserting value:", err);
    res.status(500).send("Error inserting value");
  }
});

// Async initialization block
(async () => {
  try {
    await redisClient.connect();
    redisPublisher = redisClient.duplicate();
    await redisPublisher.connect();

    app.listen(5000, () => {
      console.log("Listening on port 5000");
    });
  } catch (err) {
    console.error("Failed to connect Redis or start server:", err);
    process.exit(1);
  }
})();
