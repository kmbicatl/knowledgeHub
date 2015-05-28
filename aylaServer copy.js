var application_root	= __dirname;
var	express				= require('express');
var path				= require('path'); // path parsing module
var	url					= require("url");
var favicon				= require('serve-favicon');
var bodyParser			= require('body-parser');
//var methodOverride	= require('method-override');
var	errorhandler		= require('errorhandler');
var expressLogger		= require('express-logger');
var expressjson			= require('express-json');
var multipart			= require('connect-multiparty');
var config				= require('./libs/config');
var	log					= require('./libs/log')(module);
var	router				= express.Router();
var fs					= require("fs");
var mkpath 				= require('mkpath');
var crypto              = require('crypto');
var mime				= require('mime');
var https				= require('https');
var jade				= require('jade');
var md5					= require('MD5');
var multer 				= require('multer');
var ruleProcessor		= require('./ruleProcessor.js');
//var Curl 				= require('node-curl/lib/Curl');
var curl 				= require('node-curl');
var spawn 				= require('child_process').spawn;
var _ 					= require('underscore'); 
 
var app					= express();
var multipartMiddleware = multipart();

app.use(router);


app.use(function(req,res,next){
	if(req.method=='POST'){
		//console.log('In Post '+JSON.stringify(req.body));
		//console.log('In Post query '+JSON.stringify(req.query));
		req.query = req.body;
	}
	try{
		req.query.token = req.token.replace(/ /g,'+');
	}catch(e){}
	next();
});


app.all('/', function (req, res) {
		res.setHeader('content-type', "text/html");
		res.writeHead(200);
		html = fs.readFileSync("./index.html", "utf8");
		res.write(html);
		res.end();
});

app.get('/ayle',function(req,res){
	var shFile = {};
	var hostName = 'https://ads-dev.aylanetworks.com';
	console.log('req.query._mode :::::::::::::::::::::::::::::::::::::::::::::::'+req.query._mode);
		switch(req.query._mode){
			case 'getIssue':
					shFile.cmd = 'curl -u sgudimela:abcd1234 https://agiletest.atlassian.net/rest/api/2/issue/'+req.query.key;
			break;
			case 'login':
				console.log('login');
				shFile.cmd = 'curl -X POST -d \'{"user":{"email":"'+req.query.emailId+'", "password":"'+req.query.password+'", "application":{"app_id":"aMCA-id","app_secret":"aMCA-9097620"}}}\' -H "Content-Type:application/json" https://user.aylanetworks.com/users/sign_in.json';
			break;
			case 'loadDevices':
				console.log('load Devices');
				shFile.cmd = 'curl -H "Authorization: auth_token '+req.query.token+'" '+hostName+'/apiv1/devices.json';
			break;
			case 'getDeviceProperties':
			console.log('getDeviceProperties');
				shFile.cmd = 'curl -H "Authorization: auth_token '+req.query.token+'" '+hostName+'/apiv1/devices/'+req.query.key+'/properties.json';
			break;
			case 'getProperty':
				shFile.cmd = 'curl -H "Authorization: auth_token '+req.query.token+'" '+hostName+'/apiv1/properties/'+req.query.key+'.json';
			break;
			case 'setSwitchProperty':
			console.log('setSwitchProperty');
				shFile.cmd = 'curl -X POST -H "Content-Type:application/json" -H "Authorization:auth_token '+req.query.token+'" -d \'{"datapoint":{"value":'+req.query.value+'}}\' https://ads-dev.aylanetworks.com/apiv1/properties/'+req.query.key+'/datapoints.json';
			break;
		}
		createSHFile(shFile,function(oRes){
			if(oRes.err){
				console.log('Error : '+err);
			} else {
				console.log('File Created : '+oRes.fileName);
				oRes.dtRequest = new Date();
				
				/*readSHResFile(oRes,function(){
					res.data = oFinalRes;
					res.data._mode = req.query._mode;
					console.log('Final Response : '+JSON.stringify(res.data,null,2));
					getResponse(req,res);
				});*/
				executeSHFile(oRes,function(oFinalRes){
					console.log('File Returned');
					res.data = oFinalRes;
					res.data._mode = req.query._mode;
					console.log('Final Response : '+JSON.stringify(res.data,null,2));
					getResponse(req,res);
				});
			}
		});
		
	
});


function createSHFile(oShFile,callback){
	var dt = new Date();
	var resObj = {};
	var shFileName = dt.getFullYear()+
	(((dt.getMonth()+1).toString().length < 2)?('0'+(dt.getMonth()+1).toString()):(dt.getMonth()+1))+
	(((dt.getDate()).toString().length < 2)?('0'+(dt.getDate()).toString()):dt.getDate())+
	(((dt.getHours()).toString().length < 2)?('0'+(dt.getHours()).toString()):dt.getHours())+
	(((dt.getMinutes()).toString().length < 2)?('0'+(dt.getMinutes()).toString()):dt.getMinutes())+
	(((dt.getSeconds()).toString().length < 2)?('0'+(dt.getSeconds()).toString()):dt.getSeconds())+
	dt.getMilliseconds();
	shFileName += Math.random();
	shFileName += '.sh';
	oShFile.cmd += ' > res'+shFileName;
	resObj.fileName = shFileName;
	mkpath('./temp', function (err) {
	    if (err){ 
	    	console.log(err);
	    	resObj.err = err;
	    	callback(resObj);
	    } else {
			fs.writeFile('./temp/'+shFileName, oShFile.cmd, function (err) {
		 	 if (err){ 
	 		 	console.log(err);
    			resObj.err = err;
	    	  }
	    	   callback(resObj);
			});
		}
	});
}

function readSHResFile(oSHFile,callback){
		var resObj = {};
		var dt = new Date();
		//console.log(dt-oSHFile.dtRequest);
	if(dt-oSHFile.dtRequest > 5000){
		 resObj.err = {err:'Request Not Processed in time'};
		 callback(resObj);
	}
	
	fs.readFile('./temp/res'+oSHFile.fileName, 'utf8', function (err,data) {
		if(err && err.errno == '34' && err.code == 'ENOENT'){
			if(dt-oSHFile.dtRequest < 5000){
				readSHResFile(oSHFile,callback);
			} else {
				resObj.err = {err:'Request Not Processed in time'};
		 		callback(resObj);
			}
		} else {
			console.log('File Found');
			resObj.data = JSON.parse(data);
		  	callback(resObj);
		}
	});
	
}
function executeSHFile(oSHFile,callback){

	var resObj = {};
	var deploySh = spawn('sh', [ oSHFile.fileName ], {
	  cwd: process.env.HOME + '/Workspace/node/bickh/temp',
	  env:_.extend(process.env, { PATH: process.env.PATH + ':/usr/local/bin' })
	});
	deploySh.stdout.on('data', function (data) {
	//  console.log('stdout: ' + data);
	console.log('in data.........................');
	});
	
	deploySh.stderr.on('data', function (data) {
	//  console.log('stderr: ' + data);
		//resObj.err = data;
		console.log('in errrr.........................');
	});
	
	deploySh.on('close', function (code) {
	  	fs.readFile('./temp/res'+oSHFile.fileName, 'utf8', function (err,data) {
	  		console.log('File Written');
		if (err) {
		    console.log(err);
		    resObj.err = err;
		    callback(resObj);
		  }
		  console.log('Before Returning');
		  resObj.data = JSON.parse(data);
		  callback(resObj);
		  //return data;
		});
	});
	
//Include Read Response and Delete SH File	
}


function getResponse(req,res){
	if(!res.data)res.data=[];
	//console.log('in getResponse : '+JSON.stringify(res.jsonRes));
	//header('Content-Type: application/json');
	res.end(JSON.stringify(res.data));
}

app.get('/api', function (req, res) {
		//console.log('In /api');
		var pathname = url.parse(req.url).pathname;

		validateToken({token:req.query.token,module:req.query.module},processAction);
		function processAction(isValidToken,oRespDetail,oCredentials){
			if(isValidToken){
				reqAction = require('.'+oRespDetail);
				req.credentials = oCredentials;
				reqAction.execute(req.query,processActionResponse);
				function processActionResponse(resObj){
					res.jsonRes = resObj;
					getResponse(req,res);						
				}
			} else {
				resObj = {
					message:oRespDetail
				}
				res.jsonRes = resObj;
				getResponse(req,res);					
			}
		}
});

app.post('/api', function (req, res) {
	    //console.log('API POST is running');
		var pathname = url.parse(req.url).pathname;
});

app.use('/api',multipart);
app.use('/assets',express.static(path.join(application_root,'public', '/assets')));
app.use('/',express.static(path.join(application_root,'public')));
//app.use('/assets',multipart);

app.use(favicon(__dirname + '/public/favicon.ico')); // use standard favicon
//app.use(express.logger('dev')); // log all requests

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressjson);       // to support JSON-encoded bodies
//app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(errorhandler({ dumpExceptions: true, showStack: true }));
//app.use(methodOverride); // HTTP PUT and DELETE support
app.use(express.static(path.join(application_root, "public")));
app.use(expressLogger);

app.use(function(req, res, next){
    res.status(404);
    log.debug('Not found URL: %s',req.url);
    res.send({ error: 'Not found' });
    return;
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
    return;
});


app.listen(3001, function(){
    console.log('Express server listening on port 3001');
	log.info('Express server listening on port 3001');
	var uuid = require('node-uuid');
});


