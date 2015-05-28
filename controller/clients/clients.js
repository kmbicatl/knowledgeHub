var mongoose			= require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var Client = new Schema({
    clientId: {
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
	collection:'client'
});

Client.plugin(uniqueValidator);

var ClientModel = mongoose.model('Client', Client);


	

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