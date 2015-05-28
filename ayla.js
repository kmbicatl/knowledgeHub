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
var https				= require('https');
var jade				= require('jade');
var md5					= require('MD5');
var multer 				= require('multer');
var ruleProcessor		= require('./ruleProcessor.js');
//var Curl 				= require('node-curl/lib/Curl');
var curl 				= require('node-curl');
 
var app					= express();
var multipartMiddleware = multipart();

app.use(router);

var uploadedFileName = '';

app.use(
	multer({ dest: './uploads/',
		rename: function (fieldname, filename) {
			
		    return Math.random()+Date.now();
		},
		onFileUploadStart: function (file) {
		  console.log(file.originalname + ' is starting ...')
		},
		onFileUploadComplete: function (file) {
		  console.log(file.fieldname + ' uploaded to  ' + file.path)
		  uploadedFileName =  file.path;
		  done=true;
		}
	})
);

app.use(function(req,res,next){
	if(req.method=='POST'){
		//console.log('In Post '+JSON.stringify(req.body));
		//console.log('In Post query '+JSON.stringify(req.query));
		req.query = req.body;
	}
	try{
		req.query.token = req.token.replace(/ /g,'+');
	}catch(e){}
	if(uploadedFileName.toString().length > 0){
		req.query.filePath = uploadedFileName;	
		uploadedFileName = '';
	}
	
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
		externalRequest(req,res,function(resCont,resObj){
			//Setting Response Content									
			resObj.jsonRes = resCont;
			console.log('resCont : '+resCont);
		});
	
});

app.get('/external',function(req,res){
	//console.log('In External '+JSON.stringify(req.query));
	
	validateToken({token:req.query.token,module:req.query._module},processAction);
	function processAction(isValidToken,oRespDetail,oCredentials){
		//console.log('In Process Action : '+isValidToken);
		if(isValidToken){
			//Products = require('./model/mongoose-data').ProductsModel;
			APIsModel = require('./model/mongoose-data').APIsModel;
			APIsModel.find({apiPath:req.query._module},function(err,apis){
				if(!err && apis.length > 0){
					apis = apis[0];
					reqAction = require('./controller'+apis.requireFile);
					reqAction.options(req,res,function(optionsObj){
						if(!optionsObj.error){
							req.query.options = optionsObj.options;
							
							externalRequest(req,res,function(resCont,resObj){
								//Setting Response Content									
								resObj.jsonRes = resCont;
								getResponse(req,resObj);
							});
						} else {
								resObj.jsonRes = {error:options.error,message:options.message};
								getResponse(req,resObj);
						}	
					});
					
					
					
				} else if(!err && apis.length < 1){
					res.jsonRes = {error:err,message:'Invalid Access! There is no such API exists.'};
					getResponse(req,res);
				} else {
					console.log('Err 1: '+err);
					//Throw Err
				}
			}).where('status').equals(1);
		} else {
			console.log('Invalid Token : '+JSON.stringify(oRespDetail));
			resObj = {
				error:[{message:'Token validation failed',name:'InvalidToken',errors:{Err:{message:oRespDetail}}}],
				message:oRespDetail
			}
			res.jsonRes = resObj;
			getResponse(req,res);					
		}
	}

	
	
});

/*
app.get('/external',function(req,res){
	console.log('IN SERVER EXTERNAL');
	console.log(req.body);
	console.log(req.query);
	console.log(req.params);
	console.log(req.data);
	console.log(req.firstName);
	var url = require('url');
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	console.log('query : '+JSON.stringify(query));
	console.log('url_parts : '+JSON.stringify(url_parts));
	//console.log(JSON.stringify(req))
	var str = '';
	for(id in req){
		try{
			str+= id+' : '+req[id]+'\n';
		}catch(e){
			str+= id+' : ERRRRRR\n';
		}
	}
	//console.log(str);
});*/

app.all('/save',function(req,res){
		validateToken({token:req.query.token,module:req.query._module},processAction);
		function processAction(isValidToken,oRespDetail,oCredentials){
			if(isValidToken){
				//Products = require('./model/mongoose-data').ProductsModel;
				APIsModel = require('./model/mongoose-data').APIsModel;
				APIsModel.find({apiPath:req.query._module},function(err,apis){
					if(!err && apis.length > 0){
						apis = apis[0];
						reqAction = require('.'+apis.requireFile);
						reqAction.save(req.query,processActionResponse);
						function processActionResponse(resObj){
							res.jsonRes = resObj;
							getResponse(req,res);						
						}
					} else if(!err && apis.length < 1){
						res.jsonRes = {error:err,message:'Invalid Access! There is no such API exists.'};
						getResponse(req,res);
					} else {
						console.log('Err 1: '+err);
						//Throw Err
					}
				}).where('status').equals(1);
			} else {
				resObj = {
					error:[{message:'Token validation failed',name:'InvalidToken',errors:{Err:{message:oRespDetail}}}],
					message:oRespDetail
				}
				res.jsonRes = resObj;
				getResponse(req,res);					
			}
		}
});

app.all('/list',function(req,res){
	validateToken({token:req.query.token,module:req.query._module},processAction);
	function processAction(isValidToken,oRespDetail,oCredentials){
		if(isValidToken){
				APIsModel = require('./model/mongoose-data').APIsModel;
				//console.log('module:'+JSON.stringify(req.query._module));
				APIsModel.find({apiPath:req.query._module},function(err,apis){
					if(!err && apis.length > 0){
						apis = apis[0];
						reqAction = require('.'+apis.requireFile);
						reqAction.find(req.query.query,processActionResponse);
						function processActionResponse(resObj){
							res.jsonRes = resObj;
							getResponse(req,res);						
						}
					

					} else if(!err && apis.length < 1){
						res.jsonRes = {error:err,message:'Invalid Access! There is no such API exists.'};
						getResponse(req,res);
					} else {
						console.log('Err 1: '+err);
						//Throw Err
					}
				}).where('status').equals(1);
			} else {
				resObj = {
					error:[{message:'Token validation failed',name:'InvalidToken',errors:{Err:{message:oRespDetail}}}],
					message:oRespDetail
				}
				res.jsonRes = resObj;
				getResponse(req,res);					
			}
		}
});

app.all('/update',function(req,res){
	//console.log('in Update');
	validateToken({token:req.query.token,module:req.query._module},processAction);
	function processAction(isValidToken,oRespDetail,oCredentials){
		if(isValidToken){
				APIsModel = require('./model/mongoose-data').APIsModel;
				APIsModel.find({apiPath:req.query._module},function(err,apis){
				if(!err && apis.length > 0){
					apis = apis[0];
					reqAction = require('.'+apis.requireFile);
					reqAction.update(req.query,processActionResponse);
					function processActionResponse(resObj){
						res.jsonRes = resObj;
						getResponse(req,res);						
					}
				

				} else if(!err && apis.length < 1){
					res.jsonRes = {error:err,message:'Invalid Access! There is no such api exists.'};
					getResponse(req,res);
				} else {
					console.log('Err 1: '+err);
					//Throw Err
				}
			}).where('status').equals(1);
		} else {
				resObj = {
					error:[{message:'Token validation failed',name:'InvalidToken',errors:{Err:{message:oRespDetail}}}],
					message:oRespDetail
				}
				res.jsonRes = resObj;
				getResponse(req,res);					
			}
		}
});



app.all('/lucid',function(req,res){

//console.log('IN LUCID : ');
//console.log('IN LUCID : '+JSON.stringify(req.query));
		if(req.query.collection)
		http.get('http://216.117.39.230:8983/solr/'+req.query.collection+'/select?q='+req.query.q+'&wt=json&indent=true&rows='+req.query.rows+'&fl=id&fl=parent_s',function(_res){
		  //console.log('STATUS: ' + _res.statusCode);
		  //console.log('HEADERS: ' + JSON.stringify(_res.headers));
		  _res.setEncoding('utf8');
		  var cnt = 0,cnt1=0,cnt2=0;
		  _res.on('data', function (chunk) {
			//console.log('Before Writing Chunk: ' + cnt+':'+chunk.length+'::'+(new Date()));
			chunk = JSON.parse(chunk);
			//console.log(chunk.response.docs);
				cnt++;
				/*setInterval(function(){
					console.log('cnt1 : '+cnt1+':'+chunk.length+'::'+(new Date()));
					cnt1++;
					setTimeout(function() {
						//console.log('in end : '+cnt2+':'+chunk.length+'::'+(new Date()));
						chunk = JSON.parse(chunk);
						if(cnt2 < 5){
							console.log(JSON.stringify(chunk));
						}
						cnt2++;
						res.end(JSON.stringify(chunk),"ascii");
				
					}, 10000);
				},1000);*/
				//res.write(JSON.stringify(chunk));
		  });
		});
});

app.get('/oauth', function (req, res) {
		//console.log('In oauth');
		var pathname = url.parse(req.url).pathname;
		User = require('./model/mongoose-data').UserModel;
		//console.log(JSON.stringify(req.query));
		if(req.query.clientId && req.query.clientId == '-1'){
			delete req.query.clientId;
			delete req.query.token;	
		}
		delete req.query.token;
		//console.log(JSON.stringify(req.query));
		User.find(req.query,function (err,user) {
			//console.log('Step 1 '+err);
			if (err) return handleError(err);
			//console.log('Step user.length : '+user.length);
			if(user.length > 0){
				userProducts = []; 				
					RoleProduct = require('./model/mongoose-data').RoleProductModel;
					//console.log('user[0].roleId} : '+user[0].roleId);
					RoleProduct.find({roleId:{$in:user[0].roleId}},function(err,roleProduct){
						if(!err && roleProduct.length > 0){
							userProducts.push(roleProduct[0].productId);
						}
						productAPIs = {};
						ProductAPI = require('./controller/productAPIs/productAPIs').find({productId:{$in:userProducts[0]}},
							function(productAPIsRecords,err){
							if(!err && productAPIsRecords.list.length > 0){
								for(i=0;i<productAPIsRecords.list.length;i++){
									for(j=0;j<productAPIsRecords.list[i].apiId.length;j++){
										if(!productAPIs[productAPIsRecords.list[i].apiId[j]]){
											productAPIs[productAPIsRecords.list[i].apiId[j]] = [];
										}	
										productAPIs[productAPIsRecords.list[i].apiId[j]] = productAPIsRecords.list[i].productId;
									}
								}
								req.query.productAPIs = productAPIs;
								Token = require('./model/mongoose-data').AccessTokenModel;
								req.query.userId = user[0].userId;
								Token.save(req.query,function(oToken){
									resObj = {
												token:oToken,
												message:'Success'
											}
									res.jsonRes = resObj;
									getResponse(req,res);
								});
							}
						});
					});
			} else {
				resObj = {
							message:'Invalid User Credentials'
				}
				res.jsonRes = resObj;
				getResponse(req,res);
			}
			//getResponse(req,res);
			// Fetched!
		}).where('status').equals(1).select('user.lastName');

});

app.get('/oauthDevToken', function (req, res) {
		//console.log('In oauthToken');
		var pathname = url.parse(req.url).pathname;
		reqAction = require('./controller/app/app');
		reqAction.find({appToken:req.query.token},processActionResponse);
		function processActionResponse(resObj){
			reqAction.update({query:{appToken:req.query.token},set:{dailyCnt:resObj.dailyCnt-1,monthlyCnt:resObj.monthlyCnt-1}},processInnerActionResponse);
				function processInnerActionResponse(resObj){
					res.jsonRes = resObj;
					getResponse(req,res);						
				}
			res.jsonRes = resObj;
			getResponse(req,res);						
		}
});


app.get('/inbox', function (req, res) {
	res.render( 'inbox.jade', { token:req.query.token} );
});

app.get('/elevator/devInbox', function (req, res) {
	//console.log('in devInbox>>> '+req.query.token);
	res.render( 'devInbox.jade', { token:req.query.token} );
});


function validateToken(oQueryToken,callback){
	//callback(true,'aaaa');
	//return;
	Token = require('./model/mongoose-data').AccessTokenModel;
	if(oQueryToken){
		//console.log('$$$$$$$$'+oQueryToken.token);
		//console.log('JsonToken :'+JSON.stringify(oQueryToken));
		oQueryToken.token = oQueryToken.token.replace(/ /g,'+');
		Token.find({token:oQueryToken.token},function (err,token) {
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
								//console.log('givenRoleId : '+givenRoleId);
								//console.log('apiPath : '+oQueryToken.module);
								require('./controller/apis/apis').find({apiPath:oQueryToken.module},function(apis,err){
									if(!err && apis.list.length > 0){
										//console.log('Valid Request for API apis[0].apiId : '+apis.list[0].apiId);
										if(!token.productAPIs[apis.list[0].apiId]){
											callback(false,'Invalid Access! InSufficient previleges to acess requested API.');
										} else {
											Products = require('./model/mongoose-data').ProductsModel;
											//console.log('oQueryToken.module : '+oQueryToken.module);
											Products.find({productId:token.productAPIs[apis.list[0].apiId],status:1},function(err,products){
												if(err){
													callback(false,'Error : '+err);
													//console.log('false,Error : '+JSON.stringify(err));
												} else {
													if(products.length > 0){
														//product,api,user
														ruleProcessor.validateRules({productObj:products[0],apiObj:apis.list[0],userObj:user,tokenObj:token});
														//console.log('Require API File Path : '+apis.list[0].requireFile);
														callback(true,'/controller'+apis.list[0].requireFile);
														return;
													} else {
														callback(false,'Invalid Access! Product associated with requested API is not valid.');
														//console.log('false,Invalid Access! Product associated with requested API is not valid.');
													}
												}
												
											});
										}
									}	else {
										if(err){
											callback(false,'Error : '+err);
											//console.log('false,Error : '+JSON.stringify(err));
										}else{
											callback(false,'Invalid Access! There is no such module exists.');
											//console.log('false,Invalid Access! There is no such module exists.');
										}
									}
								});
								/*Products = require('./model/mongoose-data').ProductsModel;
								console.log('oQueryToken.module : '+oQueryToken.module);
								Products.find({module:oQueryToken.module},function(err,products){
									if(!err && products.length > 0){
										products = products[0];
										givenProductId = [products.productId];
										RoleProduct.find({givenRoleId:{$in:[this.roleId]},givenProductId:{$in:[this.productId]}},function(err,roleProduct){
											if(!err){
												if(roleProduct.length > 0){
													callback(true,products.requireFile);
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
								}).where('status').equals(1);*/
							} else {
								callback(false,'User Invalidated!');
							}
						}).where('status').equals(1);		
					});
				}
			} else {
				//if(err) Throw Err
				console.log('Before Invalid Token -1 Err : '+JSON.stringify(err));
				console.log('oQueryToken.token : '+oQueryToken.token);
				console.log('token : '+JSON.stringify(token));
				callback(false,'Invalid Token! - 1');
			}
		});
	} else {
		callback(false,'Invalid Token! - 0');
	}
}

function getResponse(req,res){
	if(!res.jsonRes)res.jsonRes=[];
	//console.log('in getResponse : '+JSON.stringify(res.jsonRes));
	//header('Content-Type: application/json');
	res.end(JSON.stringify(res.jsonRes));
}

app.post('/oauth', function (req, res) {
	    console.log('In oauth post');
		var pathname = url.parse(req.url).pathname;
		console.log('pathname : '+pathname);
		console.log('req.data : '+req.data);
		console.log('req.body : '+req.body);
		console.log('req.params : '+JSON.stringify(req.params));
		console.log('req.query : '+JSON.stringify(req.query));
//		var pquery = qs.parse(url.parse(req.url).query);
//		console.log('pquery : '+JSON.stringify(pquery));
});

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
	//var uuid1 = uuid.v1();
	//console.log(uuid.v1());
});



/*var options = {
//  hostname: 'http://216.117.39.230',
  hostname: 'https://google.com',
  port: 80,
 // path: '/solr/KonicaMinolta/select',
 //params:'q="a"&wt=json&indent=true&rows=100&fl=*',
  method: 'GET'
};*/

function externalRequest(oReq,oRes,callback){
	
/*
var options = {
//  hostname: 'http://216.117.39.230',
  hostname: 'https://ads-dev.aylanetworks.com',
//  port: 80,
  //path: '/apiv1/devices/10171/properties.json',
    path: '/apiv1/devices.json',
 //params:'q="a"&wt=json&indent=true&rows=100&fl=*',
  method: 'GET',
  agent:false,
  header:{
  	'Authorization':'auth_token 7fb3d888a5f44d19b611bfbe170a873b'
  }
};



	console.log('External Request : '+JSON.stringify(options,null,2));
	var fromDt = new Date();
	console.log('Request Begin: '+fromDt);
	
	var req = https.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  //console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	//Start Setting External Response Headers
		var list = {},
		rc = new Array();
    	rc[0] = res.headers['set-cookie'];
		oRes.writeHead(200,{'set-cookie':rc})    	
	//End Setting External Response Headers
	  var resContent = '';
	  res.on('data', function (chunk) {
	    //console.log('BODY: ' + chunk);
	    resContent += chunk;
	  });

	  res.on('end', function () {
	    try {
	      resContent = JSON.parse(resContent);
	    } catch (er) {
	      // uh oh!  bad json!
	      //res.statusCode = 400;
	      resContent = er;
	      callback('error: ' + er.message,oRes);
	    }
	    // write back something interesting to the user:
	    var toDt = new Date();
		console.log('Request End: '+toDt+'; Time Taken : '+(toDt-fromDt)/1000+' seconds');
	    console.log('Before Success Return ...');
	    var jsonp = {"version":"1.0","basePath":"http://jsondoc.eu01.aws.af.cm/api","apis":{"":[{"jsondocId":"52007353-fd81-4538-93a9-4876fb43bc7f","name":"authenticated services","description":"Authenticated methods","methods":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"67dd377c-3513-4159-b6f6-40459a43fdd2","id":"","path":"/auth/basicauth","description":"A basic authenticated method","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"e0d28d21-8bde-4631-88af-9c743e642b52","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"}},"apierrors":[{"jsondocId":"fb4ff660-0327-48d5-9366-a8f58bca7a20","code":"8000","description":"Invalid credentials"}],"supportedversions":null,"auth":{"type":"BASIC_AUTH","roles":["ROLE_USER","ROLE_ADMIN"],"testusers":{"admin":"123456","user":"123456"}},"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"067b93b0-4e17-4549-ab1c-75f5ee8c9e08","id":"","path":"/auth/basicauthnouser","description":"A basic authenticated method with no test users","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"064b1803-5870-460a-8e51-3bf9f49ecaed","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"}},"apierrors":[{"jsondocId":"6c9ea154-0004-415b-bd5b-fefe81982bfb","code":"8000","description":"Invalid credentials"}],"supportedversions":null,"auth":{"type":"BASIC_AUTH","roles":["ROLE_USER","ROLE_ADMIN"],"testusers":{}},"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"61c60701-b056-4852-b5d6-999e3aaddab7","id":"","path":"/auth/noauth","description":"A method available to everyone ","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"b6e04e98-9632-47d8-97fd-9c8797843365","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"}},"apierrors":[],"supportedversions":null,"auth":{"type":"NONE","roles":["anonymous"],"testusers":{}},"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"8585b633-5a6d-46cf-a2fb-96993e8e06b8","id":"","path":"/auth/undefinedauth","description":"A method with no annotation regarding auth","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"c71eca54-507a-498b-a9ee-09426a1baa5f","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"supportedversions":null,"auth":null,"group":""},{"jsondocId":"f5019f02-145f-4dc9-95b8-af0f9bdd6835","name":"book services","description":"Books services","methods":[{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiMethod"],"jsondocId":"8be3f3b0-ace2-4515-83e9-16fd72b0706f","id":"BOOK_LIST","path":"/books","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"69dfbb9b-cb4c-4e12-8912-902d4d074138","jsondocType":{"type":["list","book"],"mapKey":null,"mapValue":null,"oneLineText":"list of book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces","Missing documentation data: consumes"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod","Add annotation ApiResponseObject to document the returned object"],"jsondocId":"d8d46f23-e593-433c-a29b-deaf8b21d88e","id":"BOOK_PURCHASE","path":"/books/purchase/{id}","description":"","verb":"POST","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0166492a-4888-4058-b2da-81589cc22225","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":null,"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"201 - Created"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"f508c7a9-5f53-46e2-855c-bd4fabe66c09","id":"BOOK_SIMILAR","path":"/books/similar/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"2a893e77-8a78-4ed3-a9a7-4dfc50cd123b","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1f374d2b-70bd-442e-b27d-85cdf8834b4b","jsondocType":{"type":["list","book"],"mapKey":null,"mapValue":null,"oneLineText":"list of book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"9048da04-cfe9-48b8-9291-dd1c38c5a0d2","id":"BOOK_OBJECT","path":"/books/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0025fa81-9b14-4d95-a50e-b2ddc2e8e097","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"f93c6fd1-6c28-4e61-bb81-ad01057f89ff","jsondocType":{"type":["book"],"mapKey":null,"mapValue":null,"oneLineText":"book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"supportedversions":null,"auth":null,"group":""},{"jsondocId":"f945685b-6d28-405a-8cac-34c8dbdf269b","name":"errors warnings hints","description":"Methods for testing errors warnings and hints","methods":[{"jsondocerrors":["Missing documentation data: path","Missing documentation data: path parameter name"],"jsondocwarnings":["Missing documentation data: produces","Missing documentation data: consumes"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"5686fe84-c036-472a-8192-6865b862ced4","id":"","path":"Missing documentation data: path","description":"","verb":"POST","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0afe382c-23d4-4ab2-bd05-d2f02f41f444","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"9932d410-e611-4f75-8f36-77019c68828d","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"supportedversions":null,"auth":null,"group":""},{"jsondocId":"b1fc406d-fd42-4f08-b601-93f6832ba0c8","name":"type services","description":"Methods for testing correct response/body/param types","methods":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"fea6ab08-e916-4e67-9c2f-83f454b71a60","id":"","path":"/type/array/byte","description":"Gets an array of byte","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"9f3d28fe-d91a-42c9-8c1b-64afb419ae22","jsondocType":{"type":["array","byte"],"mapKey":null,"mapValue":null,"oneLineText":"array of byte"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"db1d05a4-dc96-4469-9e67-b398a2e68483","id":"","path":"/type/array/user","description":"Gets an array of user","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"46088e4e-df1a-4f33-af65-9df087b11233","jsondocType":{"type":["array","user"],"mapKey":null,"mapValue":null,"oneLineText":"array of user"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"dfe76906-b1a5-4ef4-94f4-a26bbeba69ea","id":"","path":"/type/integer","description":"Gets an integer","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"51c2e04b-ed85-4d5d-b621-1d06013ad08c","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"52f111d0-699a-44c3-919c-5fa7d68d6853","id":"","path":"/type/list/set/long","description":"Gets a list of set of long","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"4ee2be23-7769-4511-b9ec-6f9b7c27a00d","jsondocType":{"type":["list","set","long"],"mapKey":null,"mapValue":null,"oneLineText":"list of set of long"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"ce7dd5f9-e8aa-4c02-9089-774c508a8115","id":"","path":"/type/list/string","description":"Gets a list of string","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"79d366fb-1f01-44eb-afa7-b40ec5e14ce2","jsondocType":{"type":["list","string"],"mapKey":null,"mapValue":null,"oneLineText":"list of string"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"db3e9fd7-ecf8-4fd9-88e1-1c80f5e8e289","id":"","path":"/type/map/list/string/integer","description":"Gets a map where key is a list of string and value is an integer","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"79528f9c-d3af-405b-a3cd-db91d1b79675","jsondocType":{"type":["map"],"mapKey":{"type":["list","string"],"mapKey":null,"mapValue":null,"oneLineText":"list of string"},"mapValue":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"oneLineText":"map[list of string, integer]"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"3ff90329-2ac8-4b5d-9801-63a08fc80cbb","id":"","path":"/type/map/string/integer","description":"Gets a map where key is string and value is integer","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"2b347413-2a9b-4160-8df9-bf199b71929d","jsondocType":{"type":["map"],"mapKey":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"mapValue":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"oneLineText":"map[string, integer]"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"52e1c379-7d85-44ce-a166-1b074a6658a7","id":"","path":"/type/responseentity","description":"Gets a response entity","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"5072e856-a025-47b1-8d13-ef8bfb2d0ec8","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"5872b699-9948-4111-a4ac-194e0d30c5f2","id":"","path":"/type/string","description":"Gets a string","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1e73b17f-8dcf-47cd-a68b-c4e25e5ce30b","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"supportedversions":null,"auth":null,"group":""},{"jsondocId":"9ba98e0b-6eb7-4290-92df-33da858f2dfa","name":"user services","description":"Methods for managing users","methods":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"85a4b81b-cc54-4750-a1a6-d74137965f61","id":"USER_LOGIN","path":"/users/login/{username}/{password}","description":"Login a user","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"03845216-ae07-4d52-a5cf-a26f08874a6d","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"username","description":"The user's username","required":"true","allowedvalues":[],"format":"","defaultvalue":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"ebd6616c-df97-4698-be0a-a70d6cec29d7","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"password","description":"The user's password","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1365e2f3-854c-488e-90f4-f0445df3313e","jsondocType":{"type":["user"],"mapKey":null,"mapValue":null,"oneLineText":"user"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"f7fc217c-1b4d-47d3-aad3-9eb03870e676","id":"","path":"/users/map","description":"Post test for map request body","verb":"POST","produces":["application/json"],"consumes":["application/json"],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":{"jsondocId":"1856f193-42f9-4244-bb74-68bc622103d2","jsondocType":{"type":["map"],"mapKey":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"mapValue":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"oneLineText":"map[string, integer]"},"jsondocTemplate":{}},"response":{"jsondocId":"2e42985b-bac7-4846-90c2-fbeeedf3bb88","jsondocType":{"type":["list","user"],"mapKey":null,"mapValue":null,"oneLineText":"list of user"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"f6ad2e56-4a3d-43f0-b514-de54a706d07e","id":"","path":"/users/q/{name}/{gender}?agemin={agemin}&agemax={agemax}","description":"Gets a user with the given gender and given age","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"d52aca6a-61f2-4f9a-9aa6-890a44d6f0fe","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"The user's name","required":"true","allowedvalues":[],"format":"","defaultvalue":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"e8471223-2d40-4dd0-8beb-b9874b24e4d0","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"gender","description":"The user's gender","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"33f47166-163a-407c-8d5f-b94c4686095f","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"agemin","description":"The user's min age","required":"true","allowedvalues":[],"format":"","defaultvalue":""},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"193df161-1aef-417b-b664-6f66920b8777","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"agemax","description":"The user's max age","required":"true","allowedvalues":[],"format":"","defaultvalue":""}],"bodyobject":null,"response":{"jsondocId":"997930fd-1b1c-4191-8462-6cbf4e1f3bb2","jsondocType":{"type":["list","user"],"mapKey":null,"mapValue":null,"oneLineText":"list of user"}},"apierrors":[{"jsondocId":"974f4f86-5dd7-4a8d-b6ec-39a8cc78293b","code":"3000","description":"User not found"},{"jsondocId":"75f28364-e660-4906-acbf-ad60bc38e42a","code":"9000","description":"Illegal argument"}],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":["Add description to ApiQueryParam"],"jsondocId":"a4dfabab-1132-4c9e-899a-521598be9203","id":"","path":"/users/wildcardParametrizedList?wildcardParametrizedList={wildcardParametrizedList}","description":"Gets a list of users. This is a test for wildcard parametrized list","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"22aaeb2a-265f-47e8-a38b-f64d662833b7","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"wildcardParametrizedList","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":""}],"bodyobject":null,"response":{"jsondocId":"52731af8-af93-46b2-9d5d-81030b9f2f00","jsondocType":{"type":["list","wildcard"],"mapKey":null,"mapValue":null,"oneLineText":"list of wildcard"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"f7a1db09-3a15-44ae-ab10-cdcaea1569af","id":"","path":"/users/{gender}/{age}","description":"Gets users with the given gender and age","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"5c05c3ac-c89a-4a30-8258-29b16dd1882f","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"gender","description":"The user's gender","required":"true","allowedvalues":[],"format":"","defaultvalue":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"08099268-8904-4071-85c8-5df303bfaaa5","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"age","description":"The user's required age","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"31026ba7-7c2c-4876-8d1f-b9241f4efd2f","jsondocType":{"type":["list","user"],"mapKey":null,"mapValue":null,"oneLineText":"list of user"}},"apierrors":[{"jsondocId":"69fbe023-d8b1-4ba7-a4c0-37f87f6d669b","code":"3000","description":"User not found"},{"jsondocId":"e8905c33-6526-493f-8f5a-b06dd51b3e96","code":"9000","description":"Illegal argument"}],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"108a2e1d-8a82-427f-b55b-9fe9f87dcb88","id":"","path":"/users/{id}","description":"Gets a user with the given ID","verb":"GET","produces":["application/json","application/xml"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"ab842170-555c-487c-b064-d25b44a6c5b2","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"The user's ID","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"14a562c3-32ef-48c4-98db-ddeb6a886c60","jsondocType":{"type":["user"],"mapKey":null,"mapValue":null,"oneLineText":"user"}},"apierrors":[{"jsondocId":"e069899b-7993-4f6c-b9c2-c1c844b008dd","code":"3000","description":"User not found"},{"jsondocId":"4c651527-c784-4d5f-8aca-5e5d1480d5ba","code":"9000","description":"Illegal argument"}],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"308449f3-8a23-4148-9d01-45793f8aee61","id":"","path":"/users?name={name}","description":"Gets a user with the given name","verb":"GET","produces":["application/json","application/xml"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"79f62ea8-01fa-4240-9937-16ba8b0b216c","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"The user's name","required":"true","allowedvalues":[],"format":"","defaultvalue":""}],"bodyobject":null,"response":{"jsondocId":"51bfd87d-06c4-4418-be03-c873dd6f7d11","jsondocType":{"type":["user"],"mapKey":null,"mapValue":null,"oneLineText":"user"}},"apierrors":[{"jsondocId":"7abde40d-4976-4c83-a932-8ddb7fc6c077","code":"3000","description":"User not found"},{"jsondocId":"0d504a1d-9008-46e1-9da0-6e28c88cbe3e","code":"9000","description":"Illegal argument"}],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"supportedversions":null,"auth":null,"group":""}],"Geography":[{"jsondocId":"907b3e66-5c23-4610-8b1b-a8180651bdd2","name":"city services","description":"Methods for managing cities","methods":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"a0d61066-e8e4-4ab0-9fca-0eb56572ccb3","id":"","path":"/cities","description":"Saves a city","verb":"POST","produces":["application/json","application/xml"],"consumes":["application/json","application/xml"],"headers":[{"jsondocId":"4606ff5f-58c5-43c5-9a83-a479a9ac7b45","name":"api_id","description":"The api identifier","allowedvalues":["abc","cde"]}],"pathparameters":[],"queryparameters":[],"bodyobject":{"jsondocId":"d692cb18-e489-4016-ba0d-ef2caf2f23cb","jsondocType":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"},"jsondocTemplate":{"squarekm":0,"name":"","population":0}},"response":{"jsondocId":"65374f9f-110b-46bd-ae4e-a1ec67da55b1","jsondocType":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"}},"apierrors":[{"jsondocId":"92fb1943-1f89-42af-bdad-a9f65aa2f119","code":"3000","description":"City already existing"},{"jsondocId":"bff76d04-b104-449b-8def-e85dd6e303a7","code":"9000","description":"Illegal argument"}],"supportedversions":{"since":"1.2-SNAPSHOT","until":""},"auth":null,"responsestatuscode":"201 - Created"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"49ed1f63-5e86-4654-b7f7-a1d13c8894ef","id":"","path":"/cities/map","description":"Gets a map of cities","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1325b127-df66-4af8-b90a-49bd76b5399c","jsondocType":{"type":["map"],"mapKey":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"mapValue":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"},"oneLineText":"map[string, city]"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"ab19f474-b7d0-447b-a437-9f4a70362eff","id":"","path":"/cities/map/list","description":"Gets a map of list of cities","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"e7b9f153-d3c1-4d2b-998a-b5fe27451c22","jsondocType":{"type":["map"],"mapKey":{"type":["list","string"],"mapKey":null,"mapValue":null,"oneLineText":"list of string"},"mapValue":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"},"oneLineText":"map[list of string, city]"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"bcd72733-b52b-41da-b4d4-15fa443ba86d","id":"","path":"/cities/name/{name}","description":"Gets a city with the given name. (Allowed values are just to demonstrate the annotation attribute)","verb":"GET","produces":["application/json","application/xml"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"a23aa7a0-3d56-4e4f-91fb-1932bc9d3643","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"The city name","required":"true","allowedvalues":["Melbourne","Sydney","Perth"],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"df85c808-086c-4406-81b9-2173810876e2","jsondocType":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"}},"apierrors":[{"jsondocId":"6aaabf2c-9957-4334-843a-fe410684fcd4","code":"2000","description":"City not found"},{"jsondocId":"7b71c11f-5643-4951-bb16-94be84c6a4d9","code":"9000","description":"Illegal argument"}],"supportedversions":{"since":"1.0","until":"2.12"},"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"81cd41dd-7b49-4e44-8a8f-cd9205354076","id":"","path":"/cities/{id}","description":"Gets a city by its ID","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"66cde077-6f14-4a0c-9e6e-48f891fb7a97","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"The city ID","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"085a8448-75f4-43ea-91b3-123b9a6d8dc3","jsondocType":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"2d6273ea-d9e8-4651-8c98-c1383b684aaf","id":"","path":"/cities/{id}","description":"Modifies a city","verb":"PUT","produces":["application/json","application/xml"],"consumes":["application/json"],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"3f7d9112-adf3-4637-bfbf-b23c30dab5a1","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"The city ID","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":{"jsondocId":"e10d5d04-dfe2-49c5-8438-63af3f0c5768","jsondocType":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"},"jsondocTemplate":{"squarekm":0,"name":"","population":0}},"response":{"jsondocId":"e84c1423-1e9e-441e-9ceb-a962697ed473","jsondocType":{"type":["city"],"mapKey":null,"mapValue":null,"oneLineText":"city"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add annotation ApiResponseObject to document the returned object"],"jsondocId":"403813a4-2d1d-40a4-a82c-36ca04a59cbe","id":"","path":"/cities/{id}","description":"Deleted a city by its ID","verb":"DELETE","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"bbfa6084-3213-4cb4-8448-6f452fa521b6","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"The city ID","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":null,"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"204 - No Content"}],"supportedversions":{"since":"1.0","until":""},"auth":null,"group":"Geography"},{"jsondocId":"21f43d56-6a84-465a-97b1-2087c4079b53","name":"continent services","description":"Methods for managing continents","methods":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"ae437b83-c965-44f7-806d-cad933051e6a","id":"","path":"/continents/africa","description":"Gets Africa.","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"445c1d62-afc0-4f23-9481-c7a1e22c909a","jsondocType":{"type":["continent"],"mapKey":null,"mapValue":null,"oneLineText":"continent"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"f9b6f237-51a6-4b56-9177-de4d78332137","id":"","path":"/continents/america","description":"Gets America.","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"da48c897-7ba6-4a0d-9220-c173f3817d0a","jsondocType":{"type":["continent"],"mapKey":null,"mapValue":null,"oneLineText":"continent"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"3591f2c3-d7b8-42c6-9796-043c90c3fc39","id":"","path":"/continents/australia","description":"Gets Australia.","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"45db22e0-23dc-4636-a6ef-3004bbe3d0c8","jsondocType":{"type":["continent"],"mapKey":null,"mapValue":null,"oneLineText":"continent"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":["Add description to ApiPathParam"],"jsondocId":"0077668b-4569-413e-b189-e23c124ee2bb","id":"","path":"/continents/{continent}","description":"Gets a continent by name.","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"c007e259-ee3f-461b-938b-a388f64e9698","jsondocType":{"type":["continent"],"mapKey":null,"mapValue":null,"oneLineText":"continent"},"name":"continent","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"32eb039b-5334-4f1b-a856-7996b45715a9","jsondocType":{"type":["continent"],"mapKey":null,"mapValue":null,"oneLineText":"continent"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"supportedversions":null,"auth":null,"group":"Geography"},{"jsondocId":"e5a2549b-5aea-44c0-9948-2f1b36dcda20","name":"country services","description":"Methods for managing countries","methods":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"dc35b630-dca7-4acf-a164-361c1f5fcd7b","id":"","path":"/countries","description":"Gets all the countries","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"248c0a9b-ae87-4788-bd51-160e272c1c6a","jsondocType":{"type":["list","country"],"mapKey":null,"mapValue":null,"oneLineText":"list of country"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"67a1c844-ff49-4910-a2f3-035aff24b7d8","id":"","path":"/countries","description":"Saves a country, with a list of cities","verb":"POST","produces":["application/json"],"consumes":["application/json"],"headers":[{"jsondocId":"2230e838-1b25-4de6-9194-ca433a8adece","name":"application_id","description":"The application id","allowedvalues":[]}],"pathparameters":[],"queryparameters":[],"bodyobject":{"jsondocId":"15d80c2a-e488-4a68-acf2-145f8a02e648","jsondocType":{"type":["country"],"mapKey":null,"mapValue":null,"oneLineText":"country"},"jsondocTemplate":{"squarekm":0,"cities":[],"name":"","continent":"","population":0}},"response":{"jsondocId":"8cb33b04-441b-4489-af0c-5052d1502241","jsondocType":{"type":["country"],"mapKey":null,"mapValue":null,"oneLineText":"country"}},"apierrors":[{"jsondocId":"6fa9b238-1b88-450a-b156-f78dc0e572cb","code":"5000","description":"Duplicate country"},{"jsondocId":"cfef91a5-60b2-4665-bb6e-f96890b8438e","code":"6000","description":"Validation error"},{"jsondocId":"e0bde83d-87e2-4b06-9100-d6b28c03c286","code":"7000","description":"Invalid application id"},{"jsondocId":"3cecd931-d44e-488c-b0cc-2547eafe72c1","code":"9000","description":"Illegal argument"}],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":["Add description to ApiPathParam","Add annotation ApiResponseObject to document the returned object"],"jsondocId":"bd8bba70-ddae-419e-af0e-101d97ad17ca","id":"","path":"/countries/{id}","description":"Deletes the country with the given id","verb":"DELETE","produces":["application/json"],"consumes":[],"headers":[{"jsondocId":"2d3ba385-0fca-45df-867a-4e79e0caf15a","name":"application_id","description":"The application id","allowedvalues":[]}],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"5f59ded3-8692-46fc-aef5-5ee47d8822ba","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":null,"apierrors":[{"jsondocId":"c4516088-d3b6-41ba-a701-f42dc6511dca","code":"1000","description":"Country not found"},{"jsondocId":"b9e42b15-b78f-4730-9700-cb3489f54cca","code":"7000","description":"Invalid application id"},{"jsondocId":"91c81c39-0cde-4fa6-9bad-400b034a28f1","code":"9000","description":"Illegal argument"}],"supportedversions":null,"auth":null,"responsestatuscode":"204 - No Content"},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":["Add description to ApiPathParam","Add annotation ApiResponseObject to document the returned object"],"jsondocId":"1e360b02-c930-4958-a858-f40efcb03bc5","id":"","path":"/countries/{name}","description":"Gets a country with the given name.","verb":"GET","produces":["application/json","application/xml"],"consumes":[],"headers":[{"jsondocId":"9453ac25-42e1-4ced-b53e-30c1bf95c87a","name":"country-header","description":null,"allowedvalues":["abc"]}],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"5b2e8a4b-593e-45c1-8c8b-6a1b65d059f1","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":null,"apierrors":[{"jsondocId":"476084b7-c148-45e8-ae0c-705d6ff4ebe7","code":"1000","description":"Country not found"},{"jsondocId":"d159d952-e69a-47a1-89c1-b288e6337258","code":"9000","description":"Illegal argument"}],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"supportedversions":{"since":"1.0","until":"2.12"},"auth":null,"group":"Geography"}]},"objects":{"":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"1d7a284f-5ee6-42ab-8dfb-4f6ed66ba033","name":"author","description":"An author object belonging to an external jar","fields":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"cb273451-5be2-42a2-9e28-00c59d32d415","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"The author's id","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"131fb377-bf63-4b01-a6a3-27d646d41935","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"The author's name","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"d33bbe65-69f4-47a0-a30d-f03356fd0ccb","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"surname","description":"The author's surname","format":"","allowedvalues":[],"required":"false","supportedversions":null}],"supportedversions":null,"allowedvalues":null,"group":"","jsondocTemplate":{"id":0,"name":"","surname":""}},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"7377ea5a-65fb-4ac7-9820-65b942afadcd","name":"book","description":"A book object belonging to an external jar","fields":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0270477f-c958-44f5-9766-cf631bf1aa2d","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"The book's id","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"a823843d-335b-4446-bca5-8bd2febcbeb6","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"The book's title","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"f7b0e086-b8c8-4747-96f0-74ea058a5654","jsondocType":{"type":["author"],"mapKey":null,"mapValue":null,"oneLineText":"author"},"name":"author","description":"The book's author","format":"","allowedvalues":[],"required":"false","supportedversions":null}],"supportedversions":null,"allowedvalues":null,"group":"","jsondocTemplate":{"id":0,"author":{"id":0,"name":"","surname":""},"name":""}},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":["Add description to field: id","Add description to field: username"],"jsondocId":"2b2e5938-b921-470e-ae1d-062a23554aa1","name":"hint","description":"","fields":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"81ff434a-e737-42a8-a16c-d8c32ba7a725","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"e6678a59-4832-4c71-8a27-4201409fb899","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"username","description":"","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"f8d8ecb0-0264-43de-85c0-4166232700ff","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"age","description":"The age of this object","format":"","allowedvalues":[],"required":"true","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"dfe06c72-8e27-40ba-933f-d7ad5a0c6483","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"gender","description":"The gender of this object","format":"","allowedvalues":[],"required":"false","supportedversions":null}],"supportedversions":null,"allowedvalues":null,"group":"","jsondocTemplate":{"id":0,"username":"","age":0,"gender":""}},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":["Add description to field: id"],"jsondocId":"430f93ef-f97d-42d0-8e8a-f34f4a620d12","name":"interf","description":"","fields":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"1f27f4de-73b9-495d-9a9e-44b8cd95591f","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","format":"","allowedvalues":[],"required":"false","supportedversions":null}],"supportedversions":null,"allowedvalues":null,"group":"","jsondocTemplate":{"id":0}},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"f28c2ce2-fb16-4c1b-b9fd-245416fd9705","name":"user","description":"","fields":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"2244c19c-3261-48ab-9dd9-c679c677995b","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"The ID of the user","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"478aa765-382c-408b-a295-6e25bd6179df","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"username","description":"The username of the user","format":"","allowedvalues":[],"required":"true","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"8d7c0019-7f18-4af3-a4fb-691cdae0616a","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"age","description":"The age of the user","format":"","allowedvalues":[],"required":"true","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"d34e3bf2-a857-4c14-84a3-fe2471e7112a","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"gender","description":"The gender of the user","format":"","allowedvalues":[],"required":"false","supportedversions":null}],"supportedversions":null,"allowedvalues":null,"group":"","jsondocTemplate":{"id":0,"username":"","age":0,"gender":""}}],"Geography":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"856d0ad3-e691-482e-af13-aae7004e991f","name":"city","description":"","fields":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"bdebcc23-c48b-4098-94af-3deed257c450","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"The name of the city","format":"","allowedvalues":["Melbourne","Sydney","Perth"],"required":"false","supportedversions":{"since":"1.36","until":"1.4"}},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"d80d6406-87b4-4170-9e99-a0eccd1bfe2d","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"population","description":"The population of the location","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"c35490a5-d82e-48bb-986c-d622f5c85ae4","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"square_km","description":"The square km of the location","format":"##0.00","allowedvalues":[],"required":"false","supportedversions":null}],"supportedversions":{"since":"1.3","until":"1.4"},"allowedvalues":null,"group":"Geography","jsondocTemplate":{"squarekm":0,"name":"","population":0}},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"6fc154c8-27ac-4f55-ba72-b11a2ae25f87","name":"continent","description":"An enum of continents","fields":[],"supportedversions":null,"allowedvalues":["AFRICA","AMERICA","ANTARCTICA","ASIA","AUSTRALIA","EUROPE"],"group":"Geography","jsondocTemplate":{}},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"a4134bbb-ad3c-4105-9879-5c90810a4686","name":"country","description":"","fields":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"e9bc205c-603f-4a25-b6ac-4daed75dff99","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"name","description":"The name of the country","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"6a07b5ed-1b66-4144-aca1-2b8b4972e987","jsondocType":{"type":["list","city"],"mapKey":null,"mapValue":null,"oneLineText":"list of city"},"name":"cities","description":"The cities of the country","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"a53662e4-abf0-4200-9171-e5c60242a92f","jsondocType":{"type":["continent"],"mapKey":null,"mapValue":null,"oneLineText":"continent"},"name":"continent","description":"The continent of the country","format":"","allowedvalues":["AFRICA","AMERICA","ANTARCTICA","ASIA","AUSTRALIA","EUROPE"],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"fcfeda97-a808-4089-8c1d-2a7722cf4b68","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"population","description":"The population of the location","format":"","allowedvalues":[],"required":"false","supportedversions":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"56978781-9c5a-4b84-815f-7fa3b619f6eb","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"square_km","description":"The square km of the location","format":"##0.00","allowedvalues":[],"required":"false","supportedversions":null}],"supportedversions":null,"allowedvalues":null,"group":"Geography","jsondocTemplate":{"squarekm":0,"cities":[],"name":"","continent":"","population":0}}]},"flows":{"":[{"jsondocId":"bf15f4d5-f378-4db5-abdf-f0528971e995","name":"Book purchase flow","description":"The flow for purchasing a book","preconditions":["To purchase a book there must be an existing user","The user must have an account with username and password","The user must have the role needed to purchase books"],"steps":[{"jsondocId":"aa6f720a-13ac-4182-87cd-c9800443581b","apimethodid":"USER_LOGIN","apimethoddoc":{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"85a4b81b-cc54-4750-a1a6-d74137965f61","id":"USER_LOGIN","path":"/users/login/{username}/{password}","description":"Login a user","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"03845216-ae07-4d52-a5cf-a26f08874a6d","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"username","description":"The user's username","required":"true","allowedvalues":[],"format":"","defaultvalue":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"ebd6616c-df97-4698-be0a-a70d6cec29d7","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"password","description":"The user's password","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1365e2f3-854c-488e-90f4-f0445df3313e","jsondocType":{"type":["user"],"mapKey":null,"mapValue":null,"oneLineText":"user"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}},{"jsondocId":"b1d2b542-4d05-475d-b003-6bcb2cb8a36c","apimethodid":"BOOK_LIST","apimethoddoc":{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiMethod"],"jsondocId":"8be3f3b0-ace2-4515-83e9-16fd72b0706f","id":"BOOK_LIST","path":"/books","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"69dfbb9b-cb4c-4e12-8912-902d4d074138","jsondocType":{"type":["list","book"],"mapKey":null,"mapValue":null,"oneLineText":"list of book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}},{"jsondocId":"3f2247fa-4764-47ac-a00e-cca2cf2824ad","apimethodid":"BOOK_OBJECT","apimethoddoc":{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"9048da04-cfe9-48b8-9291-dd1c38c5a0d2","id":"BOOK_OBJECT","path":"/books/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0025fa81-9b14-4d95-a50e-b2ddc2e8e097","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"f93c6fd1-6c28-4e61-bb81-ad01057f89ff","jsondocType":{"type":["book"],"mapKey":null,"mapValue":null,"oneLineText":"book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}},{"jsondocId":"8ee2a99a-f0dc-4999-b947-78fb6b7467c5","apimethodid":"BOOK_PURCHASE","apimethoddoc":{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces","Missing documentation data: consumes"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod","Add annotation ApiResponseObject to document the returned object"],"jsondocId":"d8d46f23-e593-433c-a29b-deaf8b21d88e","id":"BOOK_PURCHASE","path":"/books/purchase/{id}","description":"","verb":"POST","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0166492a-4888-4058-b2da-81589cc22225","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":null,"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"201 - Created"}}],"methods":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"85a4b81b-cc54-4750-a1a6-d74137965f61","id":"USER_LOGIN","path":"/users/login/{username}/{password}","description":"Login a user","verb":"GET","produces":["application/json"],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"03845216-ae07-4d52-a5cf-a26f08874a6d","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"username","description":"The user's username","required":"true","allowedvalues":[],"format":"","defaultvalue":null},{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"ebd6616c-df97-4698-be0a-a70d6cec29d7","jsondocType":{"type":["string"],"mapKey":null,"mapValue":null,"oneLineText":"string"},"name":"password","description":"The user's password","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1365e2f3-854c-488e-90f4-f0445df3313e","jsondocType":{"type":["user"],"mapKey":null,"mapValue":null,"oneLineText":"user"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiMethod"],"jsondocId":"8be3f3b0-ace2-4515-83e9-16fd72b0706f","id":"BOOK_LIST","path":"/books","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"69dfbb9b-cb4c-4e12-8912-902d4d074138","jsondocType":{"type":["list","book"],"mapKey":null,"mapValue":null,"oneLineText":"list of book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"9048da04-cfe9-48b8-9291-dd1c38c5a0d2","id":"BOOK_OBJECT","path":"/books/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0025fa81-9b14-4d95-a50e-b2ddc2e8e097","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"f93c6fd1-6c28-4e61-bb81-ad01057f89ff","jsondocType":{"type":["book"],"mapKey":null,"mapValue":null,"oneLineText":"book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces","Missing documentation data: consumes"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod","Add annotation ApiResponseObject to document the returned object"],"jsondocId":"d8d46f23-e593-433c-a29b-deaf8b21d88e","id":"BOOK_PURCHASE","path":"/books/purchase/{id}","description":"","verb":"POST","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0166492a-4888-4058-b2da-81589cc22225","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":null,"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"201 - Created"}],"group":""},{"jsondocId":"ec5b8d46-6039-4404-a188-4b4552679181","name":"Similar books flow","description":"The flow for getting books similar to a given book","preconditions":[],"steps":[{"jsondocId":"97b9cbdb-c532-49f0-9854-e1402b9de660","apimethodid":"BOOK_OBJECT","apimethoddoc":{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"9048da04-cfe9-48b8-9291-dd1c38c5a0d2","id":"BOOK_OBJECT","path":"/books/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0025fa81-9b14-4d95-a50e-b2ddc2e8e097","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"f93c6fd1-6c28-4e61-bb81-ad01057f89ff","jsondocType":{"type":["book"],"mapKey":null,"mapValue":null,"oneLineText":"book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}},{"jsondocId":"4370cfbc-6160-4f16-9705-eb235fd96f48","apimethodid":"BOOK_SIMILAR","apimethoddoc":{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"f508c7a9-5f53-46e2-855c-bd4fabe66c09","id":"BOOK_SIMILAR","path":"/books/similar/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"2a893e77-8a78-4ed3-a9a7-4dfc50cd123b","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1f374d2b-70bd-442e-b27d-85cdf8834b4b","jsondocType":{"type":["list","book"],"mapKey":null,"mapValue":null,"oneLineText":"list of book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}}],"methods":[{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"9048da04-cfe9-48b8-9291-dd1c38c5a0d2","id":"BOOK_OBJECT","path":"/books/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"0025fa81-9b14-4d95-a50e-b2ddc2e8e097","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"f93c6fd1-6c28-4e61-bb81-ad01057f89ff","jsondocType":{"type":["book"],"mapKey":null,"mapValue":null,"oneLineText":"book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"},{"jsondocerrors":[],"jsondocwarnings":["Missing documentation data: produces"],"jsondochints":["Add description to ApiPathParam","Add description to ApiMethod"],"jsondocId":"f508c7a9-5f53-46e2-855c-bd4fabe66c09","id":"BOOK_SIMILAR","path":"/books/similar/{id}","description":"","verb":"GET","produces":[],"consumes":[],"headers":[],"pathparameters":[{"jsondocerrors":[],"jsondocwarnings":[],"jsondochints":[],"jsondocId":"2a893e77-8a78-4ed3-a9a7-4dfc50cd123b","jsondocType":{"type":["integer"],"mapKey":null,"mapValue":null,"oneLineText":"integer"},"name":"id","description":"","required":"true","allowedvalues":[],"format":"","defaultvalue":null}],"queryparameters":[],"bodyobject":null,"response":{"jsondocId":"1f374d2b-70bd-442e-b27d-85cdf8834b4b","jsondocType":{"type":["list","book"],"mapKey":null,"mapValue":null,"oneLineText":"list of book"}},"apierrors":[],"supportedversions":null,"auth":null,"responsestatuscode":"200"}],"group":""}]}};
	    //console.log(JSON.stringify(jsonp,null,2));
	    callback(resContent,oRes);
	  });
	}).on('error', function(e) {
  		console.log("Got error: " + e.message);
  		console.log( e.stack );
	});*/
	var myJSON = [{"property":{"name":"Blue_button","base_type":"boolean","read_only":true,"direction":"output","scope":"user","data_updated_at":"null","key":361406,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"Blue_button","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"Blue_LED","base_type":"boolean","read_only":false,"direction":"input","scope":"user","data_updated_at":"2015-02-22T06:41:55Z","key":361405,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"Blue_LED","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":1}},{"property":{"name":"cmd","base_type":"string","read_only":false,"direction":"input","scope":"user","data_updated_at":"null","key":361409,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"cmd","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"decimal_in","base_type":"decimal","read_only":false,"direction":"input","scope":"user","data_updated_at":"null","key":361412,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"decimal_in","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"decimal_out","base_type":"decimal","read_only":true,"direction":"output","scope":"user","data_updated_at":"null","key":361413,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"decimal_out","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"Green_LED","base_type":"boolean","read_only":false,"direction":"input","scope":"user","data_updated_at":"2015-02-22T06:23:41Z","key":361404,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"Green_LED","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":1}},{"property":{"name":"input","base_type":"integer","read_only":false,"direction":"input","scope":"user","data_updated_at":"null","key":361407,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"input","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"log","base_type":"string","read_only":true,"direction":"output","scope":"user","data_updated_at":"null","key":361410,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"log","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"output","base_type":"integer","read_only":true,"direction":"output","scope":"user","data_updated_at":"null","key":361408,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"output","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"stream_down","base_type":"file","read_only":false,"direction":"input","scope":"user","data_updated_at":"null","key":361416,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"stream_down","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"stream_down_len","base_type":"integer","read_only":true,"direction":"output","scope":"user","data_updated_at":"null","key":361417,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"stream_down_len","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"stream_down_match_len","base_type":"integer","read_only":true,"direction":"output","scope":"user","data_updated_at":"null","key":361418,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"stream_down_match_len","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"stream_up","base_type":"file","read_only":true,"direction":"output","scope":"user","data_updated_at":"null","key":361415,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"stream_up","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"stream_up_len","base_type":"integer","read_only":false,"direction":"input","scope":"user","data_updated_at":"null","key":361414,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"stream_up_len","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":null}},{"property":{"name":"version","base_type":"string","read_only":true,"direction":"output","scope":"user","data_updated_at":"2015-02-22T06:16:54Z","key":361411,"device_key":10372,"product_name":"Ayla EVB","track_only_changes":false,"display_name":"version","host_sw_version":false,"time_series":false,"derived":false,"app_type":null,"recipe":null,"value":"demo_dp 0.10 07/09/2013 13:00:05 PDT jre"}}];
	console.log(JSON.stringify(myJSON,null,2));
	curl('https://ads-dev.aylanetworks.com/apiv1/devices.json',{'HEADER':['Authorization:auth_token 7fb3d888a5f44d19b611bfbe170a873b','Content-Type:application/json']},{VERBOSE: 1, HEADER:1,RAW: 1,DEBUG:1}, function(err) {
	    console.log(this);
	    console.log('**********');
	    console.log(this.body);
	    console.log(err);
  	});
/*  	var curl = new Curl();
  	curl.setopt('URL', 'https://ads-dev.aylanetworks.com/apiv1/devices.json');
  	var myHeaders = [];
  	myHeaders = "Authorization: auth_token 7fb3d888a5f44d19b611bfbe170a873b";
  	curl.setopt("HEADER", myHeaders);
  	// on 'data' must be returns chunk.length, or means interrupt the transfer
curl.on('data', function(chunk) {
    console.log("receive " + chunk.length);
    return chunk.length;
});

curl.on('header', function(chunk) {
    console.log("receive header " + chunk.length);
    return chunk.length;
})

// curl.close() should be called in event 'error' and 'end' if the curl won't use any more.
// or the resource will not release until V8 garbage mark sweep.
curl.on('error', function(e) {
    console.log("error: " + e.message);
    curl.close();
});


curl.on('end', function() {
    console.log('code: ' + curl.getinfo('RESPONSE_CODE'));
    console.log('done.');
    curl.close();
});

curl.perform();*/
}


