/**
 * @author Sridhar Gudimela
 * //External
 */
var fs					= require("fs");
var qs 					= require('querystring');


module.exports.options = function(req,res,callback){
	vExternalUrlOptions = require('url').parse('#API_URL#', true);
	vExternalUrlOptions.query = JSON.stringify(req.query);
	vExternalUrlOptions.query = JSON.parse(vExternalUrlOptions.query);
	vExternalUrlOptions.path += '?'+qs.stringify(vExternalUrlOptions.query)+JSON.stringify(vExternalUrlOptions.query.query);	
	callback({options:vExternalUrlOptions,'req':req,'res':res});
}


module.exports.options = externalUrlOptions;