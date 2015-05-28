var mongoose			= require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var ProductAPIs = new Schema({
    productId: {
        type: String,
        unique: true,
        required: true
    },
    apiId: {
        type: []
    },
    conf:{
    	type:{}
    }
},
{
	collection:'productAPIs'
});

ProductAPIs.plugin(uniqueValidator);

var ProductAPIsModel = mongoose.model('ProductAPIs', ProductAPIs);


	

function save(oProductAPIs,callback){
	var productAPIs = new ProductAPIsModel(oProductAPIs);
	productAPIs.save(function (err) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({productId:oProductAPIs.productId,productId:oProductAPIs.productId,message:'Success'});
	  }
	  // ProductAPIs Added!
	});
}

function update(oProductAPIs,callback){
	ProductAPIsModel.update(oProductAPIs.query,{$set:oProductAPIs.set},{upsert:true},function (err) {
		if (err){ 
			callback({error:err,message:'Failure'});
		} else {
			callback({productId:oProductAPIs.productId,message:'Success'});
		}
		// ProductAPIs Updated/Added!
	});
}

function find(oQuery,callback){
	console.log('oQuery : '+JSON.stringify(oQuery));
	ProductAPIsModel.find(oQuery,function (err,productAPIs) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({list:productAPIs,message:'Success'});
	  }
	  // ProductAPIs Records Fetched!
	});
}

module.exports.save = save;
module.exports.update = update;
module.exports.find = find;
