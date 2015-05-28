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
        required: true
    },
    password: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
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

var loop = function(){
	console.log('In Loop');
	var cnt = 10000;
	while(cnt < 11000){
		console.log('Creating : '+'mytable_'+cnt);
		var myModel = mongoose.model('mytable_'+cnt, User);
		var userObj = new myModel({userId:'sridharg',password:'abd1234',firstName:'Sridhar',created:new Date()});
		userObj.save(function (err) {
			//console.log('err : '+err);
		  if (err) return handleError(err);
		  //console.log('Saved');
		  // saved!
		});
		cnt++;
	}
}

module.exports.loop = loop;

UserModel.save = function(oUser){
	oUser = {userId:'srrrr',password:'sdfsf4242',firstName:'sridhar',lastName:'gggg'};
	console.log('In Save '+JSON.stringify(oUser));
	var userObj = new UserModel(oUser);
	console.log('userObj : '+userObj);
	console.log('userObj : '+JSON.stringify(userObj));
	userObj.save(function (err) {
		console.log('err : '+err);
	  if (err) return handleError(err);
	  console.log('Saved');
	  // saved!
	});
}


module.exports.UserModel = UserModel;

/*//http://mongoosejs.com/docs/validation.html
Toy.schema.path('color').validate(function (value) {
  return /blue|green|white|red|orange|periwinkle/i.test(value);
}, 'Invalid color');*/