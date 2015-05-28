var mongoose = require('mongoose'),
config = require('../libs/config'),
//db = mongoose.createConnection(config.get('mongoose:host'), config.get('mongoose:dbName'));
db = mongoose.connect('mongodb://'+config.get('mongoose:host')+'/'+config.get('mongoose:dbName'));
//db.on('error', console.error.bind(console, 'connection error:')),
log = require('../libs/log')(module),

crypto = require('crypto');


//db.open();
/*
db.on('open', function (ref) {
  console.log('Connected to mongo server.-Connection Open');
});

db.on('close', function (ref) {
  console.log('Connection to mongo server has been closed. -Connection Closed');
});
*/
var onErr = function(err,callback){
 mongoose.connection.close();
 console.log('IN Error : '+err);
 callback(err);
};


var Schema = mongoose.Schema;  
// User
var User = new Schema({
    userId: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
	clientId:{
	    type: String
	},
	roleId:{
	    type: []
	},
	emailId:{
		required:true,
		unique:true,
		type: String
	},
	created: {
        type: Date,
        default: Date.now
    }
},
{
	collection:'user'
});


var UserModel = mongoose.model('User', User);


module.exports.UserModel = UserModel;

// AccessToken
var AccessToken = new Schema({
    userId: {
        type: String,
		required: true
    },
	emailId:{
        type: String,
        required: true		
	},
    clientId: {
        type: String
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    productAPIs:{
    	type:{}
    },
    created: {
        type: Date,
        default: Date.now
    }
},
{
	collection:'AccessToken'
});

var AccessTokenModel = mongoose.model('AccessToken', AccessToken);

AccessTokenModel.save = function(oToken,callback){
	oToken.token = crypto.randomBytes(32).toString('base64');
	var tokenObj = new AccessTokenModel(oToken);
	tokenObj.save(function (err) {
		console.log(err);
	  if (err) return callback(err);
	  callback(oToken.token);
	  // Token Generated!
	});
}
module.exports.AccessTokenModel = AccessTokenModel;


// RoleProduct
var RoleProduct = new Schema({
    roleId: {
        type: String,
        required: true
    },
    productId: {
        type: [],
        required: true
    }
},
{
	collection:'roleProduct'
});

var RoleProductModel = mongoose.model('RoleProduct', RoleProduct);

module.exports.RoleProductModel = RoleProductModel;

// Products
var Products = new Schema({
    productId: {
        type: String,
        required: true
    },
    name: {
        type: String,
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
    }
},
{
	collection:'products'
});

var ProductsModel = mongoose.model('Products', Products);

module.exports.ProductsModel = ProductsModel;

//APIs

var APIs = new Schema({
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
	    	required: true,
	    	unique: true
	    },
		apiSource:{
			type:String,
			required:true
		},
		apiSourceType:{
			type:Number,
			required:true
		},
	    status: {
	        type: Number,
			required: true
	    }
	},{
		collection:'apis'
	});

var APIsModel = mongoose.model('APIs', APIs);

module.exports.APIsModel = APIsModel;

/*//http://mongoosejs.com/docs/validation.html
Toy.schema.path('color').validate(function (value) {
  return /blue|green|white|red|orange|periwinkle/i.test(value);
}, 'Invalid color');*/