let express = require('express');
let cors = require('cors');
const axios = require('axios');
let app = express();
const port = 3000;

// CORS

app.use(cors({
	credentials: true,
	origin: '*'
}));

// Internal API

app.get("/internal/api/v1/stock/list", (req,res) => {
	// Function
	try{
		let reqUrl = 'https://finnomena.com/fn3/api/stock/list';
		axios.get(reqUrl).then(response => {
		res.json(response.data.data);
		});
	} catch(error) {
		res.status(500).json({ message: "Cannot Get Data at this time"});	
	};
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});


app.get("/internal/api/v1/stock/financial", (req,res) => {
	// Function
	try{
		let securityID = req.query.securityID;
		let fiscal = req.query.fiscal;
		let reqUrl = `https://finnomena.com/fn3/api/stock/financial?securityID=${securityID}&fiscal=${fiscal}`	
		axios.get(reqUrl).then(response => {
		res.json(response.data.data);
		});
	} catch(error) {
		res.status(500).json({ message: "Cannot Get Data at this time"});	
	};
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});

// External API

app.get("/api/v1/stock/inquiry", async (req,res) => {
	// Function
	
	try{
		let quote = req.query.quote;
		let fiscal = req.query.fiscal;
		let reqUrl1 = 'http://localhost:3000/internal/api/v1/stock/list';
		
		const stockList = await axios.get(reqUrl1);
		const filterStockList = stockList.data.filter(({name}) => name === quote.toUpperCase());
		
		if (filterStockList.length != 1){
			res.status(400)
			res.json({ message: `Cannot get data for this quote(${quote})!`});
		}else{
			let securityID = filterStockList[0].security_id;
			let reqUrl2 = `http://localhost:3000/internal/api/v1/stock/financial?securityID=${securityID}&fiscal=${fiscal}`
			let financialInfo = await axios.get(reqUrl2);
			for(var key in financialInfo.data){
				financialInfo.data[key].SecurityID = quote.toUpperCase();
			};
			res.json(financialInfo.data)
		}
	} catch(error) {
		res.status(500).json({ message: "Cannot Get access at this time"});	
	};
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});


app.get("/api/v1/stock/available/list", async (req,res) => {
	// Function
	
	try{
		let reqUrl1 = 'http://localhost:3000/internal/api/v1/stock/list';
		const stockList = await axios.get(reqUrl1);
		var availableList = [];
		
		for (var i = 0, length = stockList.data.length; i < length; i += 1) {
			let data = {"id":i+1,'quote':stockList.data[i].name};
			availableList[i] = data;
		};
		res.json(availableList);
	} catch(error) {
		res.status(500).json({ message: "Cannot Get Data at this moment"});
	};
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});

// New
const { Validator,ValidationError } = require("express-json-validator-middleware");
const { validate } = new Validator();
const schema = require('./schema');
const middleware = require('./middleware/middleware');
const jwtToken = require('./jwt-token');
const jwt = require('jsonwebtoken');
app.use(express.json());
app.use(middleware.validationErrorMiddleware);
require('dotenv').config();



app.post("/api/v1/user/login",validate({ body: schema.loginSchema }),function(req, res, next) {
    let data = req.body;
    let token = jwtToken.create(req.body.username)
    let outputData = {
        "status": {
            "code": 1000,
            "description" :"Successfully Sign In!",
        },
        "data": {
            "token" : token,
            "username" : req.body.username,
            "redirectPath" : "/home.html"
        }
    }
    res.json(outputData);
    next();
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});

app.post("/api/v1/user/register",validate({ body: schema.registerSchema }),function(req, res, next) {
    let data = req.body;
    let outputData = {
        "status": {
            "code": 1000,
            "description" :"Successfully Sign Up!",
        },
        "data":{
            "redirectPath" : "/signin.html"
        }
    }
    res.json(outputData);
    next();
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});

app.post("/api/v1/user/auth", middleware.auth, (req, res) => {
    let outputData = {
        "status": {
            "code": 1000,
            "description" :"Successfully Authentication!",
        }
    }
    res.status(200).json(outputData)
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
})

// yahoo finance
var yahooFinance = require('yahoo-finance');


app.get("/api/v1/stock/price/inquiry", (req,res,next) => {
	let symbol = req.query.symbol;
	let from = req.query.from;
	let to = req.query.to;
	let period = req.query.period;
	try {
		yahooFinance.historical({
			symbol: `${symbol}`,
			from: `${from}`,
			to: `${to}`,
			period: `${period}`
		}, function (err, quotes) {
			if (quotes.length === 0){
				res.status(400).json({
					"status": {
						"code" : 1899,
						"description": "Cannot get data for this symbol!"
					}
				});
			}else{
				quotes.sort((a, b) => {
					return new Date(a.date) - new Date(b.date);
				})
				output = {
					"status": {
						"code": 1000,
						"description" :"Successfully inquiry stock price!",
					},
					"data":{
						"historyPrice" : quotes
					}
				}
				res.json(output)
			}
		});
	} catch(error) {
		res.status(400).json({
			"status": {
				"code" : 1899,
				"description": "Cannot process at this moment, please try again!"
			}
		});
		next();
	}
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});

// SET100
app.get("/api/v1/stock/set100/list", async (req,res) => {
	// Function
	try{
		let reqUrl1 = 'https://www.set.or.th/api/set/index/set100/composition?lang=th';
		const stockList = await axios.get(reqUrl1);
		let set100 = stockList.data.composition.stockInfos
		var set100List = [];
		for (var i = 0, length = set100.length; i < length; i += 1) {
			let data = {"id":i+1,'quote':set100[i].symbol};
			set100List[i] = data;
		};
		output = {
			"status": {
				"code": 1000,
				"description" :"Successfully inquiry SET100!",
			},
			"data":{
				"set100List" : set100List
			}
		}		
		res.json(output);
	} catch(error) {
		res.status(400).json({
			"status": {
				"code" : 1899,
				"description": "Cannot process at this moment, please try again!"
			}
		});
	};
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});

// SET50
app.get("/api/v1/stock/set50/list", async (req,res) => {
	// Function
	try{
		let reqUrl1 = 'https://www.set.or.th/api/set/index/set50/composition?lang=th';
		const stockList = await axios.get(reqUrl1);
		let set50 = stockList.data.composition.stockInfos
		var set50List = [];
		for (var i = 0, length = set50.length; i < length; i += 1) {
			let data = {"id":i+1,'quote':set50[i].symbol};
			set50List[i] = data;
		};
		output = {
			"status": {
				"code": 1000,
				"description" :"Successfully inquiry SET50!",
			},
			"data":{
				"set100List" : set50List
			}
		}		
		res.json(output);
	} catch(error) {
		res.status(400).json({
			"status": {
				"code" : 1899,
				"description": "Cannot process at this moment, please try again!"
			}
		});
	};
	// Log Request
	console.log(`API Method: ${req.method}`);
	console.log(`API Path: ${req.path}`);
	console.log(`Request Host: ${req.hostname}`);
	console.log(`Request Origin: ${req.ip}`);
	console.log(`Request Url: ${req.originalUrl}`);
	console.log(`Request Date: ${new Date().toJSON().slice(0, 10)}`);
	console.log(`Request Time: ${new Date().toJSON().slice(11, 24)}`);
	console.log(`Response Status: ${res.statusCode}`);
	console.log("---------------------------");
});

// Test

app.get("/test", async (req,res) => {
	let set100 = await axios.get('http://localhost:3000/api/v1/stock/set100/list')
	let set100List = set100.data.data.set100List
	for(var key in set100List){
		set100List[key].quote = set100List[key].quote+".BK";
	};
	let data = [];
	let promises = [];
	for (i = 0; i < set100List.length; i++) {
		let quote = set100List[i].quote
		let url = `http://localhost:3000/api/v1/stock/price/inquiry?symbol=${quote}&from=2021-11-09&to=2022-11-10&period=d`
	  promises.push(
		axios.get(url).then(response => {
		  data.push(response.data.data);
		})
	  )
	}
	
	Promise.all(promises).then(() => res.json(data));

});

app.listen(port, () => {
	console.log("Server running on port 3000");
	console.log("---------------------------");
})


