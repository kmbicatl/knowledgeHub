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

	emailId: {

	
	type: Email

	},

	notes: {

	
	type: String

	},

	createdBy: {

	
	type: String

	},

	dateCreated: {

	
	type: Date

	}
}
,
{
	collection:'KHAppointments'
});

API.plugin(uniqueValidator);

var APIModel = mongoose.model('KHAppointments', API);

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