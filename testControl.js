var mongoose			= require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;  


	console.log('req.query._module : '+req.query._module);
	validateToken({token:req.query.token,module:req.query._module},getData);
	function getData(isValidToken,requireFilePath,oToken) {
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
				//var apitest = new APITestModel({data:req.query.data});
				getDataFromDb(function(oData){
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