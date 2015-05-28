/**
 * @author Sridhar Gudimela
 * //External
 */
//var mongoose			= require('mongoose');
//var mongoUtils			= require('../utils/mongoUtils.js');
//var uniqueValidator = require('mongoose-unique-validator');
var fs					= require("fs");
var config				= require('../../libs/config');
/*
var Schema = mongoose.Schema;

var API = new Schema(
   #SCHEMA_MODEL#
,
{
	collection:'#COLLECTION_NAME#'
});

API.plugin(uniqueValidator);

var APIModel = mongoose.model('#API_MODEL_NAME#', API);

function save(oAPI,callback){
		//mongoUtils.getNextSequence('apiId',function(oSeq){
		//oAPI.apiId = oSeq;
		var api = new APIModel(oAPI);
		api.save(function (err) {
		  if (err){ 
			callback({error:err,message:'Failure'});
		  } else {
			callback({message:'Success'});
		  }
		  // API Added!
		});
}

function find(oQuery,callback){
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
*/

var externalUrlOptions = require('url').parse('http://localhost:8080/list', true);

module.exports.options = externalUrlOptions;