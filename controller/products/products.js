var mongoose			= require('mongoose');
var mongoUtils			= require('../utils/mongoUtils.js');
var uniqueValidator		= require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var Product = new Schema({
    productId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
		unique: true,
        required: true
    },
/*    module: {
        type: String,
        required: true
    },
    requireFile: {
        type: String,
        required: true
    },*/
    conf:{
    	type:{}
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
	collection:'products'
});

Product.plugin(uniqueValidator);

var ProductModel = mongoose.model('Product', Product);

function save(oProduct,callback){
	mongoUtils.getNextSequence('productId',function(oSeq){
		oProduct.productId = oSeq;
		var product = new ProductModel(oProduct);
		product.save(function (err) {
		  if (err){ 
			callback({error:err,message:'Failure'});
		  } else {
			callback({productId:oProduct.productId,message:'Success'});
		  }
		  // Product Added!
		});
	});
}

function update(oProduct,callback){
	console.log('oProduct.query : '+JSON.stringify(oProduct.query));
	console.log('oProduct.set : '+JSON.stringify(oProduct.set));
	ProductModel.update(oProduct.query,{$set:oProduct.set},{upsert:true},function (err) {
		if (err){ 
			console.log('In Err : '+err);
			callback({error:err,message:'Failure'});
		} else {
			console.log('In Success');
			callback({productId:oProduct.productId,message:'Success'});
		}
		// Product Updated/Added!
	});
} 

function find(oQuery,callback){
	ProductModel.find(oQuery,function (err,product) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({list:product,message:'Success'});
	  }
	  // Product Records Fetched!
	});
}

module.exports.save = save;
module.exports.update = update;
module.exports.find = find;