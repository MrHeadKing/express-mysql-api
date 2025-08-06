
const redis = require("redis");

const client = redis.createClient({
    url : "redis://localhost:6379"
});

client.connect().then(
    () => console.log("Redis bağlantısı başarılı")
).catch(console.error);


module.exports = client;