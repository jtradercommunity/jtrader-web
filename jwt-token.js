const jwt = require('jsonwebtoken');
require('dotenv').config();

function create(username){
    // Create token
    const token = jwt.sign(
        { "username": username },
        process.env.TOKEN_KEY,
        {
            expiresIn: "2h"
        }
    )
    return token;
}

module.exports = {create}