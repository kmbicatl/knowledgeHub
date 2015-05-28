/**
 * @author Sridhar Gudimela
 * //External
 */
var fs					= require("fs");
var qs = require('querystring');
var patientSearch				= require('./search');

module.exports.options = function(req,res,callback){
	vExternalUrlOptions = require('url').parse('http://localhost:8080/list', true);
	vExternalUrlOptions.query = JSON.stringify(req.query);
	vExternalUrlOptions.query = JSON.parse(vExternalUrlOptions.query);
	vExternalUrlOptions.path += '?'+qs.stringify(vExternalUrlOptions.query)+JSON.stringify(vExternalUrlOptions.query.query);	
	callback({options:vExternalUrlOptions,'req':req,'res':res});
}

module.exports.find = function(oQuery,callback){
		//console.log('>>in serch.js from server2 : oQuery : '+JSON.stringify(oQuery));
		patientSearch.find(oQuery,callback);
}