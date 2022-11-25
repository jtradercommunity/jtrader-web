const {Client} = require('pg')

const client = new Client({
    host: 'localhost',
    user: 'admin',
    port: 5432,
    password: 'JTrader2021',
    database: 'jtrader'
})

module.exports = client
