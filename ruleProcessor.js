
function validateRules(oParams){
	//validateProductRules(oParams.productObj);
//	console.log('Inside ValidateRules');
	//try{
		if(oParams.productObj.conf)
		global['validateProductRules'](oParams.productObj,function(respType,mesg){
			console.log('XXXYYYY');
		})['startDate']();
	//}catch(e){
		//console.log('Exception : '+e);
	//}
	//validateProductAPIRules(oParams.apiObj);
}

global.validateProductRules = function(oProduct,callback){
	this.startDate = function(){
		currDate = new Date();
		if(oProduct.conf.startDate > currDate ){
			callback(false,'Product is yet to activate');
		} else {
			callback(true,'Start Date is Good!');
		}
	}
	
	this.endDate = function(){
		currDate = new Date();
		if(oProduct.conf.endDate < currDate){
			callback(false,'End Date is expired');
		} else {
			callback(true,'End Date is Good!');
		}
	}
	
	return this;
}

function validateProductAPIRules(oAPI){
	function maxHits(){
		console.log('API Rules');	
	}
}
module.exports.validateRules = validateRules;