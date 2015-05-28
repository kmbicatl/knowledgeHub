var mongoose			= require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var RoleProducts = new Schema({
    roleId: {
        type: String,
        unique: true,
        required: true
    },
    productId: {
        type: []
    }
},
{
	collection:'roleProduct'
});

RoleProducts.plugin(uniqueValidator);

var RoleProductsModel = mongoose.model('RoleProducts', RoleProducts);


	

function save(oRoleProducts,callback){
	var roleProducts = new RoleProductsModel(oRoleProducts);
	roleProducts.save(function (err) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({roleId:oRoleProducts.roleId,productId:oRoleProducts.productId,message:'Success'});
	  }
	  // RoleProducts Added!
	});
}

function update(oRoleProducts,callback){
	console.log('oRoleProducts.query : '+oRoleProducts.query);
	console.log('oRoleProducts.set : '+oRoleProducts.set);
	console.log('oRoleProducts.addIfNotExists : '+oRoleProducts.addIfNotExists);
	RoleProductsModel.update(oRoleProducts.query,{$set:oRoleProducts.set},{upsert:true},function (err) {
		if (err){ 
			callback({error:err,message:'Failure'});
		} else {
			callback({roleId:oRoleProducts.roleId,productId:oRoleProducts.productId,message:'Success'});
		}
		// RoleProducts Updated/Added!
	});
}

function find(oQuery,callback){
	console.log('oQuery : '+JSON.stringify(oQuery));
	RoleProductsModel.find(oQuery,function (err,roleProducts) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({list:roleProducts,message:'Success'});
	  }
	  // RoleProducts Records Fetched!
	});
}

module.exports.save = save;
module.exports.update = update;
module.exports.find = find;
