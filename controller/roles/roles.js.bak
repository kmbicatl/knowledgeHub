var mongoose			= require('mongoose');
var mongoUtils			= require('../utils/mongoUtils.js');
var uniqueValidator		= require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var Role = new Schema({
    roleId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
		unique: true,
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
	collection:'role'
});

Role.plugin(uniqueValidator);

var RoleModel = mongoose.model('Role', Role);


	

function save(oRole,callback){
	mongoUtils.getNextSequence('roleId',function(oSeq){
		var role = new RoleModel(oRole);
		role.save(function (err) {
		  if (err){ 
			  callback({error:err,message:'Failure'});
		  } else {
			callback({roleId:oRole.roleId,message:'Success'});
		  }
		  // Role Added!
		});
	});
	
}

function find(oQuery,callback){
	RoleModel.find(oQuery,function (err,role) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({list:role,message:'Success'});
	  }
	  // Role Records Fetched!
	});
}

module.exports.save = save;
module.exports.find = find;