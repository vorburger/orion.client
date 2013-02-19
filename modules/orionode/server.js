/*******************************************************************************
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global __dirname console module exports process require*/
var path = require('path');
var util = require('util');
var args = require('./lib/args');
var Deferred = require('deferred-fs').Deferred;
var startServer = require('./index.js');

var CONFIG_FILE_PATH = path.join(__dirname, 'orion.conf');
var DEFAULT_WORKSPACE_PATH = path.join(__dirname, '.workspace');

function printError(err) {
	console.log('Error launching server:');
	console.log(err.stack);
}

/**
 * This module launches the server when require()'d.
 * Variables that may be set for testing:
 *   process.env.TEST_CONFIG_FILE
 *   args.testArgv
 */
module.exports = args.readConfigFile(process.env.TEST_CONFIG_FILE || CONFIG_FILE_PATH).then(function(configParams) {
	var commandLineArgs = args.parseArgs(args.testArgv || process.argv);
	// Command-line arguments (if passed) override config params
	var params = args.mixin({}, configParams, commandLineArgs);
	console.log('using args: ' + JSON.stringify(params));
	// Validate the npm_path, then launch the server
	return args.checkNpmPath(params).then(function(params) {
		var dev = Object.prototype.hasOwnProperty.call(params, 'dev');
		var log = Object.prototype.hasOwnProperty.call(params, 'log');
		var password = String.prototype.trim.call(params.password || params.pwd || '');
		var port = params.port || params.p || 8081;
		var workspaceArg = params.workspace || params.w;
		var workspaceDir = workspaceArg ? path.resolve(process.cwd(), workspaceArg) : DEFAULT_WORKSPACE_PATH;
		return args.ensureDirsExist([workspaceDir]).then(function(dirs) {
			if (dev) {
				console.log('Development mode:\tyes');
			}
			if (log) {
				console.log('Log server requests: \tyes');
			}
			if (password) {
				console.log('Password: \tyes');
			}
			console.log(util.format('Using workspace: %s', workspaceDir));
			console.log(util.format('Listening on port %d...', port));
			try {
				return new Deferred().resolve(startServer({
					port: port,
					workspaceDir: dirs[0],
					password: password,
					configParams: configParams,
					dev: dev,
					log: log
				}));
			} catch (e) {
				printError(e);
			}
		});
	});
}).then(null, printError);
