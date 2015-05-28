/**
 * @author Sridhar Gudimela
 * //Internal
 */
var mongoose			= require('mongoose');
var mongoUtils			= require('../utils/mongoUtils.js');
var uniqueValidator = require('mongoose-unique-validator');
var fs					= require("fs");
var config				= require('../../libs/config');

var Schema = mongoose.Schema;

var API = new Schema(
   {
	mrnId:{
	
	type:Number
		
	},
	
	firstName: {

	
	type: String

	},

	lastName: {

	
	type: String

	},

	emailId: {

	
	type: String

	},

	filePath: {

	
	type: String

	}
}
,
{
	collection:'KHPatient'
});

API.plugin(uniqueValidator);

var APIModel = mongoose.model('KHPatient', API);

function save(oAPI,callback){
		mongoUtils.getNextSequence('mrnId',function(oSeq){
			oAPI.mrnId = oSeq;
			var api = new APIModel(oAPI);
			api.save(function (err) {
			  if (err){ 
				callback({error:err,message:'Failure'});
			  } else {
				callback({mrnId:oAPI.mrnId,message:'Success'});
			  }
			  // API Added!
			});
		});
}


function find(oQuery,callback){
//	if(!isNaN(oQuery.mrnId))
//	oQuery.mrnId = parseInt(oQuery.mrnId);
	console.log('oQuery >> : '+JSON.stringify(oQuery));
	try{
		oQuery.mrnId = parseInt(oQuery.mrnId);
	}catch(e){}
	APIModel.find(oQuery,function (err,records) {
	  if (err){ 
		callback({error:err,message:'Failure'});
	  } else {
		callback({list:records,message:'Success'});
	  }
	  // API Records Fetched!
	});
}

module.exports.save = save;
module.exports.find = find;