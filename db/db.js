const mysql = require("mysql2");

const db = mysql.createConnection({
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME,
    waitForConnections : true,
    connectionLimit : 10,
    queueLimit : 0
});


db.connect(err => {
    if(err) throw err;
    console.log("Database connect successfully");
})


module.exports = db;