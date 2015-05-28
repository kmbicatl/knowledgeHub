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
var crypto              = require('crypto');
var mime				= require('mime');
var http				= require('http');
var jade				= require('jade');
var md5					= require('MD5');

var app					= express();
var multipartMiddleware = multipart();

app.use(router);

function getResponse(req,res){
	if(!res.jsonRes)res.jsonRes=[];
	console.log('JSON.stringify(res.jsonRes) : '+JSON.stringify(res.jsonRes));
	res.end(JSON.stringify(res.jsonRes));
}

app.all('/',function(req,res){
		res.setHeader('content-type', "text/html");
		res.writeHead(200);
		html = fs.readFileSync("./postData.html", "utf8");
		res.write(html);
		res.end();
});

function validateToken(oQueryToken,callback){
	Token = require('./model/mongoose-data').AccessTokenModel;
	if(oQueryToken){
		console.log('oQueryToken.token : '+oQueryToken.token);
		Token.find({token:oQueryToken.token},function (err,token) {
			console.log('token : '+token);
			console.log('err : '+err);
			if(!err && token.length == 1){
				token = token[0];
				if((new Date())-token.created > (config.get('security:tokenLife')*1000)){
					//Expired
					Token.remove({token:oQueryToken.token},function(err){
						if(!err){
							callback(false,'Invalid Token! Token Expired.');							
						} else {
							//Throw Err
						}
					});
				} else {
					Token.update({token:oQueryToken.token},{$set:{created:new Date()}},{},function(err){				
						User = require('./model/mongoose-data').UserModel;
						User.find({userId:token.userId},function(err,user){
							if(!err && user.length == 1){							
								user = user[0];
								RoleProduct = require('./model/mongoose-data').RoleProductModel;
								givenRoleId = user.roleId;
								Products = require('./model/mongoose-data').ProductsModel;
								Products.find({module:oQueryToken.module},function(err,products){
									if(!err && products.length > 0){
										products = products[0];
										givenProductId = [products.productId];
										RoleProduct.find({givenRoleId:{$in:[this.roleId]},givenProductId:{$in:[this.productId]}},function(err,roleProduct){
											if(!err){
												if(roleProduct.length > 0){
													callback(true,products.requireFile,token);
												} else {
													callback(false,'Invalid Access! InSufficient previleges to acess requested product.');
												}
											} else {
												console.log('Err : '+err);
												//Throw Err
											}
										});
									} else if(!err && products.length < 1){
										callback(false,'Invalid Access! There is no such module exists.');																	
									} else {
										console.log('Err 1: '+err);
										//Throw Err
									}
								}).where('status').equals(1);
							} else {
								callback(false,'User Invalidated!');
							}
						}).where('status').equals(1);		
					});
				}
			} else {
				//if(err) Throw Err
				callback(false,'Invalid Token! - 1');
			}
		});
	} else {
		callback(false,'Invalid Token! - 0');
	}
}

var cnt = 0;
var APITestModel = '';

app.get('/getData',function(req,res){
	console.log('*************************************');
	console.log('req.query.token : '+JSON.stringify(req.query));
	req.query._module = '/apis';

	console.log('req.query._module : '+req.query._module);
	var mongoose			= require('mongoose');
	validateToken({token:req.query.token,module:req.query._module},getData);
	function getData(isValidToken,requireFilePath,oToken) {
			console.log('isValidToken : '+isValidToken)
			if(isValidToken){
			console.log('oToken : '+JSON.stringify(oToken));
			console.log('oToken.clientId: '+oToken.clientId);
			mongoose.connection.close();

			var clientSchema = md5(oToken.clientId);
			console.log('clientSchema: '+clientSchema);

				mongoose.connection.close();
			//function processResonse(isValidToken,oMesg){
				console.log('in process response '+isValidToken);

				var clientMongoose = require('mongoose'),
				config = require('./libs/config'),
				dbClient = clientMongoose.connect('mongodb://'+config.get('mongoose:host')+'/'+clientSchema);
				log = require('./libs/log')(module),
				crypto = require('crypto');
				var collectionName = req.query.collectionName;
				var ClientSchema = mongoose.Schema;  
				var APITest = new ClientSchema({
							data: {
								type: String
							},
							created:{
								type:Date,
								default:Date.now,
								required:true
							}
						});
				APITest.set('collection',collectionName);
		
				try{
					APITestModel = mongoose.model('APITest', APITest);
				}catch(e){}
				var str = '';
				for (id in res )
				{
					str += id+' : '+res[id]+'\n';
				}
				console.log('Before : '+str);
				console.log('***************************');
				//var apitest = new APITestModel({data:req.query.data});
				getDataFromDb(function(oData){
						str = '';
										for (id in res )
										{
											str += id+' : '+res[id]+'\n';
										}
						console.log('After : '+str);
						console.log('***************************');

					  console.log('oData : '+oData);
						res.write(JSON.stringify(oData));
					  resObj = {
						message:'TestData444444'
					  }
						res.jsonRes = resObj;
					//  getResponse(req,res);

				});
			function getDataFromDb(callback){	
				APITestModel.find({},function (err,apiResData) {
					callback(apiResData);
		  resObj = {
						message:'TestData444444'
				}
						res.jsonRes = resObj;
		  getResponse(req,res);


					  if (err){
						console.log('Error : '+err);
						console.log('Data Error');
						resObj = {
							message:'Data Saved Successfully'
						}
						res.jsonRes = resObj;
					  }else {
						console.log('Data List Successfully');
						console.log('apiResData : '+JSON.stringify(apiResData));
						resObj = {
							list:apiResData,
							message:'Success'
						}
						res.jsonRes = resObj;
						res.write("Data Here");
					  }
					  res.end();
					  //getResponse(req,res);

					  // Token Generated!
				});
			}

				/*APITestModel.update({1:1},{$push:{data:[Date.now]}},{upsert:true},function (err) {
					if (err){ 
						console.log('err'+err);
					} else {
						console.log('Data Saved Successfully');
					}
					// APITest Updated/Added!
				});*/
			//}
		} else {
					resObj = {
						message:requireFilePath
					}
						res.jsonRes = resObj;
		}
		  getResponse(req,res);

	}
});

app.get('/saveData',function(req,res){
	console.log('*************************************');
	console.log('req.query.token : '+JSON.stringify(req.query));
	req.query._module = '/apis';
	console.log('req.query._module : '+req.query._module);
	var mongoose			= require('mongoose');
	validateToken({token:req.query.token,module:req.query._module},setData);
	function setData(isValidToken,requireFilePath,oToken) {
			console.log('isValidToken : '+isValidToken)
			console.log('oToken : '+JSON.stringify(oToken));
			console.log('oToken.clientId: '+oToken.clientId);
			mongoose.connection.close();
			if(isValidToken){
			var clientSchema = md5(oToken.clientId);
			console.log('clientSchema: '+clientSchema);

				mongoose.connection.close();
			//function processResonse(isValidToken,oMesg){
				console.log('in process response '+isValidToken);
				var clientMongoose = require('mongoose'),
				config = require('./libs/config'),
				dbClient = clientMongoose.connect('mongodb://'+config.get('mongoose:host')+'/'+clientSchema);
				log = require('./libs/log')(module),
				crypto = require('crypto');
				var collectionName = req.query.collectionName;
				var ClientSchema = mongoose.Schema;  
				var APITest = new ClientSchema({
							data: {
								type: String
							},
							created:{
								type:Date,
								default:Date.now,
								required:true
							}
						});
				APITest.set('collection',collectionName);
		
				try{
					APITestModel = mongoose.model('APITest', APITest);
				}catch(e){}
				var apitest = new APITestModel({data:req.query.data});

				apitest.save(function (err) {
					  if (err){
						console.log('Error : '+err);
						console.log('Data Saved Successfully');
						resObj = {
							message:'Data Saved Successfully'
						}
						res.jsonRes = resObj;
					  }else {
						console.log('Data Saved Successfully');
						resObj = {
							message:'Data Saved Successfully'
						}
						res.jsonRes = resObj;
					  }
					  getResponse(req,res);

					  // Token Generated!
				});

				/*APITestModel.update({1:1},{$push:{data:[Date.now]}},{upsert:true},function (err) {
					if (err){ 
						console.log('err'+err);
					} else {
						console.log('Data Saved Successfully');
					}
					// APITest Updated/Added!
				});*/
			//}
		} else {
					resObj = {
						message:requireFilePath
					}
						res.jsonRes = resObj;
		}
		  getResponse(req,res);

	}
});

app.post('/api', function (req, res) {
	    console.log('API POST is running');
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
	log.info('Express server listening on port  3001');
	//setData();
});



var options = {
//  hostname: 'http://216.117.39.230',
  hostname: 'https://google.com',
  port: 80,
 // path: '/solr/KonicaMinolta/select',
 //params:'q="a"&wt=json&indent=true&rows=100&fl=*',
  method: 'GET'
};
