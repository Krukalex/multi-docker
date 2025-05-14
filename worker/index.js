const { redisHost, redisPort } = require("./keys");
const redis = require("redis");

// Create client
const redisClient = redis.createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

const sub = redisClient.duplicate();

const fib = (index) => {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
};

const start = async () => {
  await redisClient.connect();
  await sub.connect();

  sub.subscribe("insert", async (message) => {
    const value = fib(parseInt(message));
    await redisClient.hSet("values", message, value.toString());
    console.log(`Set Fibonacci(${message}) = ${value}`);
  });
};

start().catch((err) => {
  console.error("Error starting worker:", err);
});
