var mongoose			= require('mongoose');
var uniqueValidator		= require('mongoose-unique-validator');
var mongooseTypes		= require("mongoose-types");
var mailer 				= require("nodemailer");


var Client				= require("../clients/clients");

mongooseTypes.loadTypes(mongoose, "email");

var Schema = mongoose.Schema;  



var Schema = mongoose.Schema;  
// User
var User = new Schema({
    userId: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
	secret: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
		required:true
    },
    lastName: {
        type: String,
		required:true
    },
	emailId:{
		type:String,
		unique: true,
		required:true
	},
	clientId:{
	    type: String,
        required: true
	},
	phoneNbr:{
		type:String
	},
	title:{
		type:String
	},
	address:{
		type:String
	},
	city:{
		type:String
	},
	state:{
		type:String
	},
	zipCode:{
		type:String
	},
	country:{
		type:String
	},
	roleId:{
	    type: []
	},
	created: {
        type: Date,
        default: Date.now
    }
},
{
	collection:'user'
});

User.plugin(uniqueValidator)

var UserModel = mongoose.model('Users', User);

function save(oUser,callback){
	oUser.userId = 	crypto.randomBytes(64).toString('base64');
	oUser.secret = 	crypto.randomBytes(64).toString('base64');
	if(oUser.clientId == '-1'){
		Client.save({name:oUser.companyName,status:1},function(oClient){
			if(oClient.message == 'Failure'){
				Client.find({name:oUser.companyName},function(oClient){
					console.log(oClient);
					console.log(JSON.stringify(oClient));
					if(oClient.message != 'Failure'){
						oUser.clientId = oClient.list[0].clientId;
						saveUser(oUser,callback);
					} else {
						callback({error:oClients.err,message:'Failure'});
					}
				});
			} else {
				oUser.clientId = oClient.clientId;
				saveUser(oUser,callback);
			}
		});
	} else {
		oUser.password = 	crypto.randomBytes(64).toString('base64');
		saveUser(oUser,callback);
	}
}

function saveUser(oUser,callback){
	var user = new UserModel(oUser);
		user.save(function (err) {
		  if (err){ 
			  callback({error:err,message:'Failure'});
		  } else {
				sendMail(oUser);
			  callback({userId:oUser.userId,message:'Success'});
		  }
		  // User Added!
		});
}

function update(oUserRoles,callback){
	UserModel.update(oUserRoles.query,{$set:oUserRoles.set},{upsert:true},function (err) {
		if (err){ 
			callback({error:err,message:'Failure'});
		} else {
			callback({userId:oUserRoles.userId,roleId:oUserRoles.roleId,message:'Success'});
		}
		// UserRoles Updated/Added!
	});
}

function find(oQuery,callback){
	UserModel.find(oQuery,function (err,user) {
	  if (err){ 
		callback({error:err,message:'Failure'});
	  } else {
		callback({list:user,message:'Success'});
	  }
	  // User Records Fetched!
	});
}

function sendMail(oEmail){
	// Use Smtp Protocol to send Email
    var smtpTransport = mailer.createTransport("SMTP",{
        service: "Gmail",
        auth: {
            user: "sgudimela@kmbs.konicaminolta.us",
            pass: "Abcd1234#"
        }
    });


	console.log('oEmail : '+JSON.stringify(oEmail));
    var mail = {
        from: "KonicaMinolta <info@kmbic.com>",
        to: oEmail.emailId,
        subject: "Registered Developer Confirmation",
        text: "",
        html: "Thank you for signing up to be an KnowledgeHub Registered Developer.<br><br>Sincerely,<br>KnowledgeHub Developer Support"
    }

    smtpTransport.sendMail(mail, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log("Message sent: " + response.message);
        }

        smtpTransport.close();
    });
}
module.exports.save = save;
module.exports.update = update;
module.exports.find = find;