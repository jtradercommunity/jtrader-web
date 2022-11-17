const sqlite3 = require('sqlite3').verbose();
let sql;

//connect to database
function dbConnection(){
    const db = new sqlite3.Database('./db/jtrader.db',sqlite3.OPEN_READWRITE,(err)=>{
        if (err) return console.error(err.message);
    })
    return db
}

module.exports = {dbConnection}