var mongoose			= require('mongoose');
var mongoUtils			= require('../utils/mongoUtils.js');
var uniqueValidator = require('mongoose-unique-validator');
var fs					= require("fs");
var config				= require('../../libs/config');
var mkpath = require('mkpath');

var Schema = mongoose.Schema;

var API = new Schema({
    apiId: {
        type: Number,
        unique: true,
        required: true
    },
    name: {
        type: String,
		required: true
    },
    apiPath:{
    	type:String,
    	required: true,
    	unique: true    	
    },
    requireFile:{
    	type:String,
    	required: true
    	//unique: true
    },
	apiType:{
		type:Number,
		required:true
	},
	apiSource:{
		type:String,
		required:true
	},
	apiSourceType:{
		type:Number,
		required:true
	},
	apiAttrName:{
		type:[]
	},
    status: {
        type: Number,
		required: true
    },
	created: {
        type: Date,
        default: Date.now
    }
},
{
	collection:'apis'
});

API.plugin(uniqueValidator);

API.virtual('apiTypeName').get(function () {
	return (this.apiType==1)?'System':'Extension';
});
API.virtual('apiSourceTypeName').get(function () {
	return (this.apiSourceType==1)?'Internal':'External';
});

var APIModel = mongoose.model('API', API);

function save(oAPI,callback){
	mongoUtils.getNextSequence('apiId',function(oSeq){
		oAPI.apiId = oSeq;
		var api = new APIModel(oAPI);
		api.save(function (err) {
		  if (err){ 
			callback({error:err,message:'Failure'});
		  } else {
		  	createAPIFile(api);
			callback({apiId:oAPI.apiId,message:'Success'});
		  }
		  // API Added!
		});
	});
}

function find(oQuery,callback){
	APIModel.find(oQuery,function (err,apis) {
	  if (err){ 
		callback({error:err,message:'Failure'});
	  } else {
		callback({list:apis,message:'Success'});
	  }
	  // API Records Fetched!
	});
}


function createAPIFile(oAPI){
	readAPIMasterSampleFile(oAPI,function(oData){
		//fs.writeFile(config.get('apiCreatePath')+'API_'+oAPI.apiId+'.js', oData, function (err) {
		mkpath('./controller'+oAPI.requireFile.substr(0,oAPI.requireFile.lastIndexOf('/')), function (err) {
		    if (err) console.log(err);
			fs.writeFile('./controller'+oAPI.requireFile+'.js', oData, function (err) {
		 	 if (err) 
		 		 return console.log(err);
			});
		});	
	});
}

function readAPIMasterSampleFile(oAPI,callback){
	console.log('oAPI.apiSourceTypeName : '+oAPI.apiSourceTypeName);
	fs.readFile(config.get('apiMasterSampleFile'+oAPI.apiSourceTypeName), 'utf8', function (err,data) {
	if (err) {
	    console.log(err);
	    callback(console.log(err));
	  }
	  console.log(data);
	  callback(processAPIMasterSampleFile(oAPI,data));
	  //return data;
	});
}

function processAPIMasterSampleFile(oAPI,data){
	//Formating apiAttrName string - Begin
	var schemaStr = oAPI.apiAttrName.join(',');
	console.log('1: '+schemaStr);
	if(schemaStr.indexOf(',') == 0){
		schemaStr = schemaStr.substr(1);
	}
	console.log('2: '+schemaStr);
	if(schemaStr.lastIndexOf(',') == (schemaStr.length-1)){
		schemaStr = schemaStr.substr(0,schemaStr.length-1);
	}
	console.log('3: '+schemaStr);
	schemaStr = '{'+schemaStr.replace(/,{/g,',').replace(/}}/g,'}').substr(1)+'}';
	console.log('4: '+schemaStr);
	schemaStr = JSON.stringify(JSON.parse(schemaStr),null,'\n\t');
	schemaStr = schemaStr.replace(/"/g,'');
	//Formating apiAttrName string - End
	if(oAPI.apiSourceTypeName=='Internal'){
		data = data.replace('#SCHEMA_MODEL#',schemaStr);
		data = data.replace('#COLLECTION_NAME#',oAPI.apiSource);
		data = data.replace('#API_MODEL_NAME#',oAPI.apiSource);
	} else {
		data = data.replace('#API_URL#',oAPI.apiSource);
	}
	return data;
}
module.exports.save = save;
module.exports.find = find;