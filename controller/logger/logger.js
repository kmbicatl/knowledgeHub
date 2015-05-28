var mongoose			= require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

var Logger = new Schema({
    logId: {
        type: Number,
        unique: true,
        required: true
    },
    userId: {
        type: String,
		unique: true,
        required: true		
    },
    clientId: {
        type: Number,
		required: true
    },
    token: {
        type: String,
		required: true
    },
	reqType:{
		type: String,
		required: true
	},
	module:{
		type: String,
		required: true
	},
	queryStr:{
		type: String
	},
	clientAgent:{
		type: String	
	},
	remoteAddress:{
		type: String	
	},
	remotePort:{
		type: String	
	},
	errors:{
		type:[]	
	},
	resBytes:{
		type: Number,
		required: true
	},
	beginDate: {
        type: Date,
        default: Date.now
    },
	endDate: {
        type: Date,
        default: Date.now
    }
},
{
	collection:'logger'
});

Logger.plugin(uniqueValidator);

var LoggerModel = mongoose.model('Logger', Logger);


function save(oClient,callback){
	oClient.clientId = 	crypto.randomBytes(64).toString('base64');
	var client = new ClientModel(oClient);
	client.save(function (err) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({clientId:oClient.clientId,message:'Success'});
	  }
	  // Client Added!
	});
}

function find(oQuery,callback){
	ClientModel.find(oQuery,function (err,client) {
	  if (err){ 
		  callback({error:err,message:'Failure'});
	  } else {
		callback({list:client,message:'Success'});
	  }
	  // Client Records Fetched!
	});
}

module.exports.save = save;
module.exports.find = find;