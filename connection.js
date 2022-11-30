const {Client} = require('pg')

const client = new Client({
    host: '185.78.166.68',
    user: 'admin',
    port: 5432,
    password: 'JTrader2021',
    database: 'jtrader'
})

module.exports = client
