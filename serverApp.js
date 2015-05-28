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
var multer 				= require('multer');
var ruleProcessor		= require('./ruleProcessor.js');

var app					= express();
var multipartMiddleware = multipart();

app.use(router);

var uploadedFileName = '';

app.use(
	multer({ dest: './public/uploads/',
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
		req.query = req.body;
	}
	if(typeof req.query.query == 'string'){
		try{
			req.query.query = JSON.parse(req.query.query);
		}catch(e){}
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

app.get('/custForm',function(req,res){
		res.setHeader('content-type', "text/html");
		res.writeHead(200);
		html = fs.readFileSync("./public/custForm.html", "utf8");
		res.write(html);
		res.end();
});

app.get('/external',function(req,res){
	console.log('In External');
	
	validateToken({token:req.query.token,module:req.query._module},processAction);
	function processAction(isValidToken,oRespDetail,oCredentials){
		console.log('In Process Action : '+isValidToken);
		if(isValidToken){
			//Products = require('./model/mongoose-data').ProductsModel;
			APIsModel = require('./model/mongoose-data').APIsModel;
			APIsModel.find({apiPath:req.query._module},function(err,apis){
				if(!err && apis.length > 0){
					apis = apis[0];
					reqAction = require('./controller'+apis.requireFile);
					req.query.options = reqAction.options;
					
					externalRequest(req,function(resObj){
						res.jsonRes = resObj;
						getResponse(req,res);
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
		if(uploadedFileName.toString().length > 0){
			req.query.filePath = uploadedFileName;
		console.log('in /save '+req.query.filePath);	
			uploadedFileName = '';
		}

		validateToken({token:req.query.token,module:req.query._module},processAction);
		function processAction(isValidToken,oRespDetail,oCredentials){
			console.log('In Process Action : '+isValidToken);
			if(isValidToken){
				//Products = require('./model/mongoose-data').ProductsModel;
				APIsModel = require('./model/mongoose-data').APIsModel;
				APIsModel.find({apiPath:req.query._module},function(err,apis){
					if(!err && apis.length > 0){
						apis = apis[0];
						reqAction = require('./controller/'+apis.requireFile);
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
				console.log('module:'+JSON.stringify(req.query._module));
				APIsModel.find({apiPath:req.query._module},function(err,apis){
					if(!err && apis.length > 0){
						apis = apis[0];
						reqAction = require('./controller/'+apis.requireFile);
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
	console.log('in Update');
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

console.log('IN LUCID : ');
console.log('IN LUCID : '+JSON.stringify(req.query));
		if(req.query.collection)
		http.get('http://216.117.39.230:8983/solr/'+req.query.collection+'/select?q='+req.query.q+'&wt=json&indent=true&rows='+req.query.rows+'&fl=id&fl=parent_s',function(_res){
		  console.log('STATUS: ' + _res.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(_res.headers));
		  _res.setEncoding('utf8');
		  var cnt = 0,cnt1=0,cnt2=0;
		  _res.on('data', function (chunk) {
			console.log('Before Writing Chunk: ' + cnt+':'+chunk.length+'::'+(new Date()));
			chunk = JSON.parse(chunk);
			console.log(chunk.response.docs);
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
				/*		resObj = {
												token:'aaaa',
												message:'Success'
											}
									res.jsonRes = resObj;
									getResponse(req,res);*/
				
		var pathname = url.parse(req.url).pathname;
		User = require('./model/mongoose-data').UserModel;
		console.log('Step 1 : '+JSON.stringify(req.query));
		User.find(req.query,function (err,user) {
			console.log('Step 2');
			if (err) return handleError(err);
			console.log('Step 3');
			console.log('err : '+JSON.stringify(err));
			console.log('user : '+JSON.stringify(user));
			if(user.length > 0){
				console.log('Step 4');
				userProducts = []; 				
					RoleProduct = require('./model/mongoose-data').RoleProductModel;
					console.log('Step 5');
					RoleProduct.find({roleId:{$in:user[0].roleId}},function(err,roleProduct){
						console.log('Step 6');
						if(!err && roleProduct.length > 0){
							userProducts.push(roleProduct[0].productId);
						}
						console.log('Step 7');
						productAPIs = {};
						ProductAPI = require('./controller/productAPIs/productAPIs').find({productId:{$in:userProducts[0]}},
							function(productAPIsRecords,err){
								console.log('Step 8');
							if(!err && productAPIsRecords.list.length > 0){
									console.log('Step 9');
								for(i=0;i<productAPIsRecords.list.length;i++){
									console.log('Step 10');
									for(j=0;j<productAPIsRecords.list[i].apiId.length;j++){
										if(!productAPIs[productAPIsRecords.list[i].apiId[j]]){
											productAPIs[productAPIsRecords.list[i].apiId[j]] = [];
										}	
										productAPIs[productAPIsRecords.list[i].apiId[j]] = productAPIsRecords.list[i].productId;
									}
								}
								console.log('Step 11');
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

app.get('/inbox', function (req, res) {
	res.render( 'inbox.jade', { token:req.query.token} );
});


function validateToken(oQueryToken,callback){
	//callback(true,'aaaa');
	//return;
	Token = require('./model/mongoose-data').AccessTokenModel;
	if(oQueryToken){
		console.log(JSON.stringify(oQueryToken));
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
								console.log('givenRoleId : '+givenRoleId);
								console.log('apiPath : '+oQueryToken.module);
								require('./controller/apis/apis').find({apiPath:oQueryToken.module},function(apis,err){
									if(!err && apis.list.length > 0){
										console.log('Valid Request for API apis[0].apiId : '+apis.list[0].apiId);
										if(!token.productAPIs[apis.list[0].apiId]){
											callback(false,'Invalid Access! InSufficient previleges to acess requested API.');
										} else {
											Products = require('./model/mongoose-data').ProductsModel;
											console.log('oQueryToken.module : '+oQueryToken.module);
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
		console.log('In /api');
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
	    console.log('API POST is running');
		var pathname = url.parse(req.url).pathname;
});

app.use('/api',multipart);
app.use('/assets',express.static(path.join(application_root,'public', '/assets')));
app.use('/uploads',express.static(path.join(application_root,'public', '/uploads')));
app.use('/public/uploads',express.static(path.join(application_root,'public', '/uploads')));
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


app.listen(8080, function(){
    console.log('Express server listening on port 8080');

	log.info('Express server listening on port 8080');
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

function externalRequest(oReq,callback){
	//console.log('oReq.query server2 : '+JSON.stringify(oReq.query));
	 url = require('url');
     parsedURL = url.parse('http://10.10.92.142').hostname;
	var options = oReq.query.options;
 

	console.log(JSON.stringify(options,null,'\n\t'));
	// var req = http.get(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  var resContent = '';
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	    resContent += chunk;
	  });
	  
	  res.on('end', function () {
	    try {
	      resContent = JSON.parse(resContent);
	    } catch (er) {
	      // uh oh!  bad json!
	      //res.statusCode = 400;
	      resContent = er;
	      callback('error: ' + er.message);
	    }
	    // write back something interesting to the user:
	    console.log('Before Success Return ...');
	    callback(resContent);
	  });
}



/*var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});*/

