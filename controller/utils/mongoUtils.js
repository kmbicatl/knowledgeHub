var mongoose			= require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;  



var Counter = new Schema({
    _id: {
        type: String,
        unique: true,
        required: true
    },
    seq: {
        type: Number,
        required: true,
		default:1
    }
},
{
	collection:'counters'
});

Counter.plugin(uniqueValidator);

var CounterModel = mongoose.model('Counter', Counter);

function getNextSequence(oSeq,callback){
	CounterModel.findByIdAndUpdate(oSeq, {$inc: {seq:1}},{upsert:true}, function (err, seqRec) {
		if(!err){
			callback(seqRec.seq);
		} else {
			return callback(err);
		}
	});
	
}

module.exports.getNextSequence = getNextSequence;