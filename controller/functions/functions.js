var mongoose			= require('mongoose');
var mongoUtils			= require('../utils/mongoUtils.js');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var Function = new Schema({
    functionId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
		unique: true,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    requireFile: {
        type: String,
        required: true
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
	collection:'functions'
});

Function.plugin(uniqueValidator);

var FunctionModel = mongoose.model('Function', Function);

function save(oFunction,callback){
	mongoUtils.getNextSequence('functionId',function(oSeq){
		oFunction.functionId = oSeq;
		var _function = new FunctionModel(oFunction);
		_function.save(function (err) {
		  if (err){ 
			callback({error:err,message:'Failure'});
		  } else {
			callback({functionId:oFunction.functionId,message:'Success'});
		  }
		  // function Added!
		});
	});
}

function find(oQuery,callback){
	FunctionModel.find(oQuery,function (err,_function) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({list:_function,message:'Success'});
	  }
	  // Function Records Fetched!
	});
}

module.exports.save = save;
module.exports.find = find;