var mongoose			= require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var RoleFunctions = new Schema({
    roleId: {
        type: String,
        unique: true,
        required: true
    },
    functionId: {
        type: []
    }
},
{
	collection:'roleFunction'
});

RoleFunctions.plugin(uniqueValidator);

var RoleFunctionsModel = mongoose.model('RoleFunctions', RoleFunctions);


	

function save(oRoleFunctions,callback){
	var roleFunctions = new RoleFunctionsModel(oRoleFunctions);
	roleFunctions.save(function (err) {
	  if (err){ 
		callback({error:err,message:'Failure'});
	  } else {
		callback({roleId:oRoleFunctions.roleId,functionId:oRoleFunctions.functionId,message:'Success'});
	  }
	  // RoleFunctions Added!
	});
}

function update(oRoleFunctions,callback){
	console.log('oRoleFunctions.query : '+oRoleFunctions.query);
	console.log('oRoleFunctions.set : '+oRoleFunctions.set);
	console.log('oRoleFunctions.addIfNotExists : '+oRoleFunctions.addIfNotExists);
	RoleFunctionsModel.update(oRoleFunctions.query,{$set:oRoleFunctions.set},{upsert:true},function (err) {
		if (err){ 
			callback({error:err,message:'Failure'});
		} else {
			callback({roleId:oRoleFunctions.roleId,functionId:oRoleFunctions.functionId,message:'Success'});
		}
		// RoleFunctions Updated/Added!
	});
}

function find(oQuery,callback){
	console.log('oQuery : '+JSON.stringify(oQuery));
	RoleFunctionsModel.find(oQuery,function (err,roleFunctions) {
	  if (err){ 
		callback({error:err,message:'Failure'});
	  } else {
		callback({list:roleFunctions,message:'Success'});
	  }
	  // RoleFunctions Records Fetched!
	});
}

module.exports.save = save;
module.exports.update = update;
module.exports.find = find;
