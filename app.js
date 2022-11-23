let express = require('express');
let cors = require('cors');
const axios = require('axios');
let app = express();
const port = 3000;
const db = require('./function/dbConnection');
let dbConn = db.dbConnection()
const bcrypt = require('bcryptjs');
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



app.post("/api/v1/user/login",validate({ body: schema.loginSchema }), async function(req, res, next) {
	try{
		let reqData = req.body;
		// Check username & password
		let sqlCommand = `SELECT user_id,password FROM user_info WHERE username = '${reqData.username}'`
		let reqUrl = "http://localhost:3000/internal/api/v1/table/query"
		let payload = {"sqlCommand":sqlCommand}
		let validationCheck = await axios.post(reqUrl,payload)
		let validateResp = validationCheck.data
		if (validateResp.status.code === 1000 && validateResp.data.userInfo.length == 1){
			let validatePassword = await bcrypt.compare(reqData.password, validateResp.data.userInfo[0].password)
			if(validatePassword === true){
				// Generate Token
				let token = jwtToken.create(req.body.username)
				// Insert auth information
				let loginTime = Date(Date.now());
				let userId = validationCheck.data.data.userInfo[0].user_id
				sqlCommand = `INSERT INTO auth_info (user_id,token,login_datetime) VALUES ('${userId}', '${token}', '${loginTime.toString()}')`
				reqUrl = "http://localhost:3000/internal/api/v1/table/insert"
				payload = {"sqlCommand":sqlCommand}
				let insertAuthInfo = await axios.post(reqUrl,payload)
				let authInfoStatus = await insertAuthInfo.data.status
				if(authInfoStatus.code === 1000){
					let outputData = {
						"status": {
							"code": 1000,
							"description" :"Successfully Sign In!",
						},
						"data": {
							"token" : token,
							"userId" : validateResp.data.userInfo[0].user_id,
							"redirectPath" : "/home.html"
						}
					}
					res.json(outputData);
				}else{
					output = {
						"status": {
							"code": 1899,
							"description" : "Cannot process at this moment, please try again!",
						}
					}
					res.json(output)				
				}
				next();
			}else{
				output = {
					"status": {
						"code": 1899,
						"description" : "Invalid Password, please try again!",
					}
				}
				res.json(output);
				next();		
			}
		}else if(validateResp.status.code === 1000 && validateResp.data.userInfo.length == 0){
			output = {
				"status": {
					"code": 1899,
					"description" : "Please register your account!",
				}
			}
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1899,
					"description" : "Invalid Username or Password, please try again!",
				}
			}
			res.json(output)
		}
	}catch(err){
		output = {
			"status": {
				"code": 1899,
				"description" : "Cannot process at this moment, please try again!",
			}
		}
		res.json(output)
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

app.post("/api/v1/user/register",validate({ body: schema.registerSchema }), async function(req, res, next) {
	try{
		let reqData = req.body;
		
		// Check email & username
		let sqlCommand = `SELECT username,email FROM user_info WHERE email = '${reqData.email}' OR username = '${reqData.username}'`
		let reqUrl = "http://localhost:3000/internal/api/v1/table/query"
		let payload = {"sqlCommand":sqlCommand}
		let validationCheck = await axios.post(reqUrl,payload)
		let validateResp = validationCheck.data

		if (validateResp.status.code === 1000 && validateResp.data.userInfo.length == 0){
			validationFlag = "y"
		}else{
			validationFlag = "n"
		}

		if(validationFlag == "y"){
			let encryptedPassword = await bcrypt.hash(reqData.password, 12)
			sqlCommand = `INSERT INTO user_info (firstname,lastname,username,password,email,role) VALUES ('${reqData.firstname}','${reqData.lastname}','${reqData.username}', '${encryptedPassword}', '${reqData.email}', 'member')`

			reqUrl = "http://localhost:3000/internal/api/v1/table/insert"
			payload = {"sqlCommand":sqlCommand}
			let insertDb = await axios.post(reqUrl,payload)
			let insertDbStatus = await insertDb.data.status
			
			if (insertDbStatus.code === 1000){
				output = {
					"status": {
						"code": 1000,
						"description" :"Successfully Sign Up!",
					},
					"data":{
						"redirectPath" : "/signin.html"
					}
				}
				res.json(output)
			}else{
				output = {
					"status": {
						"code": 1899,
						"description" : "Cannot process at this moment, please try again!",
					}
				}
				res.json(output)
			}
		}else{
			output = {
				"status": {
					"code": 1899,
					"description" : "Username or Email already exists!",
				}
			}
			res.json(output)
		}
	}catch(err){
		output = {
			"status": {
				"code": 1899,
				"description" : "Cannot process at this moment, please try again!",
			}
		}
		res.json(output)
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
const { response, request } = require('express');


app.get("/api/v1/stock/price/inquiry", (req,res,next) => {
	let symbol = req.query.symbol;
	let from = req.query.from;
	let to = new Date(req.query.to);
	to.setDate(to.getDate()+1)
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
				for (var i = 0, length = quotes.length; i < length; i += 1) {
					newDate = quotes[i].date.toJSON().slice(0, 10)
					quotes[i].date = newDate
				}
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

const EMA = require('technicalindicators').EMA;
app.get("/internal/api/v1/stock/calculate/ema", async (req,res,next) => {
	let quote = req.query.quote;
	let from = req.query.from;
	let to = req.query.to;
	let ema = req.query.ema;
	try{
		let calFrom = from.replace(from.substring(0,4),from.substring(0,4)-1)
		
		let histPriceResp = await axios.get(`http://localhost:3000/api/v1/stock/price/inquiry?symbol=${quote}&from=${calFrom}&to=${to}&period=d`)
		let histPriceRaw = await histPriceResp.data.data.historyPrice
		let closePrice = [];
		for (var i = 0, length = histPriceRaw.length; i < length; i += 1) {
			closePrice[i] = histPriceRaw[i].close
		};
		let emaList = EMA.calculate({period : ema, values : closePrice});
		
		let diff = histPriceRaw.length - emaList.length

		for (var i = 0, length = diff; i < length; i += 1) {
			emaList.unshift("")
		};

		for (var i = 0, length = histPriceRaw.length; i < length; i += 1) {
			histPriceRaw[i]["EMA"] = emaList[i]
			if(emaList[i] != "" && histPriceRaw[i].close >= emaList[i]){
				histPriceRaw[i]["isEmaAbove"] = "Y"
			}else{
				histPriceRaw[i]["isEmaAbove"] = "N"
			}
		};
		res.json(histPriceRaw)
		next();
	} catch(error) {
		res.status(400).json({
			"status": {
				"code" : 1899,
				"description": "Cannot process at this moment, please try again!"
			}
		});
		next();
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

app.get("/api/v1/stock/total/ema", async (req,res,next) => {
	try{
		let set100 = await axios.get('http://localhost:3000/api/v1/stock/set100/list')
		let set100List = set100.data.data.set100List
		// let set100List = [{quote:"KKP"},{quote:"OR"}]
		let from = req.query.from;
		let to = req.query.to;
		let ema = req.query.ema;
		for(var key in set100List){
			set100List[key].quote = set100List[key].quote+".BK";
		};

		let rawData = []

		for (var i = 0, length = set100List.length; i < length; i += 1) {
			let quote = set100List[i].quote;
			let reqUrl1 = `http://localhost:3000/internal/api/v1/stock/calculate/ema?quote=${quote}&from=${from}&to=${to}&ema=${ema}`;
			const stockList = await axios.get(reqUrl1);
			let stockData = stockList.data;
			for (var x = 0, lengths = stockData.length; x < lengths; x += 1){
				data = stockData[x];
				rawData.push(data)
			}
		}

		let outputData = [];
		var dateList = rawData.map( (value) => value.date).filter( (value, index, _arr) => _arr.indexOf(value) == index);

		for (var i = 0, length = dateList.length; i < length; i += 1) {
			key = dateList[i]
			data = {"date":key,"total":0}
			outputData[i] = data;
		}

		for (var i = 0, length = rawData.length; i < length; i += 1) {
			if (rawData[i].isEmaAbove === "Y"){
				date = rawData[i].date
				for(var key in outputData){
					if ((outputData[key].date).match(date)){
						initial = outputData[key].total
						outputData[key].total = initial+1;
					} 
				}
			}
		}
		
		outputData.sort((a, b) => {
			return new Date(a.date) - new Date(b.date);
		})

		let filteredOutputData = outputData.filter(data => {
			return (
			  new Date(data.date).getTime() >= new Date(from).getTime() &&
			  new Date(data.date).getTime() <= new Date(to).getTime()
			)
		})
		
		output = {
			"status": {
				"code": 1000,
				"description" :"Successfully Retrieve Above EMA amount!",
			},
			"data":filteredOutputData
		}
		res.json(output)
	} catch(error) {
		res.status(400).json({
			"status": {
				"code" : 1899,
				"description": "Cannot process at this moment, please try again!"
			}
		});
		next();
	};
});

app.post("/internal/api/v1/table/create", async (req,res,next) => {
	let sqlCommand = req.body.sqlCommand;
	dbConn.run(sqlCommand,[],(err)=>{
		if (err) {
			output = {
				"status": {
					"code": 1899,
					"description" : "Cannot process at this moment, please try again!",
				}
			}
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1000,
					"description" : "Successfully!",
				}
			}
			res.json(output)
		}
	});
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

app.delete("/internal/api/v1/table/drop", async (req,res,next) => {
	let sqlCommand = req.body.sqlCommand;
	dbConn.run(sqlCommand,[],(err)=>{
		if (err) {
			output = {
				"status": {
					"code": 1899,
					"description" : "Cannot process at this moment, please try again!",
				}
			}
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1000,
					"description" : "Successfully!",
				}
			}
			res.json(output)
		}
	});
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

app.post("/internal/api/v1/table/insert", async (req,res,next) => {
	let sqlCommand = req.body.sqlCommand;
	dbConn.run(sqlCommand,[],(err) =>{
		if (err) {
			output = {
				"status": {
					"code": 1899,
					"description" : "Cannot process at this moment, please try again!",
				}
			}
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1000,
					"description" : "Successfully!",
				}
			}
			res.json(output)
		}
	})
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

app.put("/internal/api/v1/table/update", async (req,res,next) => {
	let sqlCommand = req.body.sqlCommand;
	dbConn.run(sqlCommand,[],(err) =>{
		if (err) {
			output = {
				"status": {
					"code": 1899,
					"description" : "Cannot process at this moment, please try again!",
				}
			}
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1000,
					"description" : "Successfully!",
				}
			}
			res.json(output)
		}
	})
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

app.post("/internal/api/v1/table/query", async (req,res,next) => {
	let sqlCommand = req.body.sqlCommand;
	dbConn.all(sqlCommand,[],(err,rows) =>{
		if (err) {
			output = {
				"status": {
					"code": 1899,
					"description" : "Cannot process at this moment, please try again!",
				}
			}
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1000,
					"description" : "Successfully!",
				},
				"data":{
					"userInfo": rows
				}
			}
			res.json(output)
		}
	})
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

app.get("/internal/api/v1/user/validate/token", async (req, res,next) =>{
	try{
		let token = req.get('Authorization');
		let userId = req.get('userId');

		let validateAuthUrl = "http://localhost:3000/internal/api/v1/table/query";
		sqlCommand = `SELECT * from auth_info WHERE user_id=${userId} AND token='${token}'`;
		let getAuthInfo = await axios.post(validateAuthUrl,{"sqlCommand":sqlCommand})
		let respAuth = await getAuthInfo.data
		if(respAuth.status.code === 1000 && respAuth.data.userInfo.length === 1){
			output = {
				"status": {
					"code": 1000,
					"description" : "Successfully!",
				},
				"data":{
					"validationResult": true
				}
			} 
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1000,
					"description" : "Successfully!",
				},
				"data":{
					"validationResult": false
				}
			} 
			res.json(output)
		}
	}catch(err){
		output = {
			"status": {
				"code": 1899,
				"description" : "Cannot process at this moment, please try again!",
			}
		}
		res.json(output)
	}
})

app.get("/api/v1/page/home", async (req,res,next) => {
	try{
		let token = req.get('Authorization');
		let userId = req.get('userId');
		let authUrl = "http://localhost:3000/internal/api/v1/user/validate/token";
		let auth = await axios.get(authUrl,{headers:{"Authorization":token,"userId":userId}})

		if(auth.data.status.code === 1000 && auth.data.data.validationResult === true) {
			let getUserInfoUrl = "http://localhost:3000/internal/api/v1/table/query";
			sqlCommand = `SELECT firstname,lastname,username,email,role from user_info WHERE user_id=${userId}`
			let getUserInfo = await axios.post(getUserInfoUrl,{"sqlCommand":sqlCommand})
			res.json(getUserInfo.data)
		}else if(auth.data.status.code === 1000 && auth.data.data.validationResult === false){
			output = {
				"status": {
					"code": 3000,
					"description" : "Invalid Credential!",
				},
				"data":{
					"redirectPath" : "/signout.html"
				}
			}
			res.json(output)
		}else{
			output = {
				"status": {
					"code": 1899,
					"description" : "Cannot process at this moment, please try again!",
				}
			}
			res.json(output)			
		}
	}catch(err){
		output = {
			"status": {
				"code": 1899,
				"description" : "Cannot process at this moment, please try again!",
			}
		}
		res.json(output)
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
})

app.listen(port, () => {
	console.log("Server running on port 3000");
	console.log("---------------------------");
})


