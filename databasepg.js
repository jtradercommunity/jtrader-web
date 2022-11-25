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
        } else {
            data = err.message;
            console.log(data)
        }
        client.end;
        return data;
    })
}

module.exports = {queryDb}
