/**
 * @author Sridhar Gudimela
 * //External
 */
var fs					= require("fs");
var qs 					= require('querystring');


module.exports.options = function(req,res,callback){
	vExternalUrlOptions = require('url').parse('http://rum.corp.zoeticx.com/api/'+req.query.apiPath, true);
	vExternalUrlOptions.query = JSON.stringify(req.query);
	vExternalUrlOptions.query = JSON.parse(vExternalUrlOptions.query);
	vExternalUrlOptions.path += '?'+qs.stringify(vExternalUrlOptions.query)+JSON.stringify(vExternalUrlOptions.query.query);
	if(req.headers['cookie']){
		vExternalUrlOptions.headers = {};
		vExternalUrlOptions.headers['cookie'] = req.headers['cookie'];
	}
	callback({options:vExternalUrlOptions,'req':req,'res':res});
}


