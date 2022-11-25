const {Client} = require('pg')

const client = new Client({
    host: 'localhost',
    user: 'admin',
    port: 5432,
    password: 'JTrader2021',
    database: 'jtrader'
})

async function queryDb(sqlCommand){
    client.connect();
    data = await client.query(sqlCommand);
    client.end();
    return data;
}

module.exports = {queryDb}
