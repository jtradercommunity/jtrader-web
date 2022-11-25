const {Client} = require('pg')

const client = new Client({
    host: 'localhost',
    user: 'admin',
    port: 5432,
    password: 'JTrader2021',
    database: 'jtrader'
})

function queryDb(sqlCommand){
    client.connect();
    client.query(sqlCommand, (err,res)=>{
        if(!err){
            data = res.rows;
            console.log(data)
            return data;
        } else {
            error = err.message;
            console.log(error)
            return error;
        }
        client.end();
    })
}

module.exports = {queryDb}
