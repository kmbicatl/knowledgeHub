/**
 * @author Sridhar Gudimela
 * //Internal
 */
var mongoose			= require('mongoose');
var mongoUtils			= require('../utils/mongoUtils.js');
var uniqueValidator 	= require('mongoose-unique-validator');
var fs					= require("fs");
var config				= require('../../libs/config');

var Schema = mongoose.Schema;

var API = new Schema(
   {
	appId: {
		type: Number,
		required:true,
		unique:true
	},
	name: {
		type: String,
		required:true,
		unique:true
	},
	appToken: {
		type: String
	},
	token: {
		type: String
	},
	description: {
		type: String
	},
	created:{
		type:Date,
		default: Date.now
	},
	dailyCnt:{
		type:Number,
		default: 100
	},
	monthlyCnt:{
		type:Number,
		default: 3000
	}
}
,
{
	collection:'app'
});

API.plugin(uniqueValidator);

var APIModel = mongoose.model('app', API);

function save(oAPI,callback){
		mongoUtils.getNextSequence('appId',function(oSeq){
		oAPI.appId = oSeq;
		oAPI.appToken = crypto.randomBytes(32).toString('base64');
		var api = new APIModel(oAPI);
		api.save(function (err) {
		  if (err){ 
			callback({error:err,message:'Failure'});
		  } else {
			callback({message:'Success'});
		  }
		  // API Added!
		});
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

function update(oApp,callback){
	APIModel.update(oApp.query,{$set:oApp.set},{upsert:true},function (err) {
		if (err){ 
			callback({error:err,message:'Failure'});
		} else {
			callback({roleId:oRoleProducts.roleId,productId:oRoleProducts.productId,message:'Success'});
		}
		// RoleProducts Updated/Added!
	});
}

module.exports.update = update;
module.exports.save = save;
module.exports.find = find;