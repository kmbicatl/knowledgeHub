var mongoose			= require('mongoose');
var mongoUtils			= require('../utils/mongoUtils.js');
var uniqueValidator = require('mongoose-unique-validator');
var fs					= require("fs");
var Schema = mongoose.Schema;  


var APITest = new Schema({
			collectionName: {
				type: String,
				required: true
			},
			collectionRec:{
				type:[]	
			}
		});

APITest.set('collection','testAPI');

APITest.plugin(uniqueValidator);


var APITestModel = mongoose.model('APITest', APITest);


//var counterAPITest = 0;
function save(oAPI,callback){
	console.log('in APITest Save : '+JSON.stringify(oAPI));
	APITestModel.update(oAPI.query,{$push:oAPI.set},{upsert:true},function (err) {
		console.log('oAPI.set.collectionRec : '+oAPI.set.collectionRec);
		if (err){ 
			callback({error:err,message:'Failure'});
		} else {
			callback({collectionName:oAPI.collectionName,collectionRec:oAPI.collectionRec,message:'Success'});
		}
		// APITest Updated/Added!
	});
}
 

function find(oQuery,callback){
	APITestModel.find(oQuery,function (err,product) {
	  if (err){ 
		callback({error:err,message:'Failure'});
	  } else {
		callback({list:product,message:'Success'});
	  }
	  // API Records Fetched!
	});
}

module.exports.save = save;
module.exports.find = find;