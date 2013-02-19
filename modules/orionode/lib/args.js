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
/*global console exports process require*/
/*jslint laxbreak:true regexp:false*/
var async = require('../lib/async');
var compat = require('./compat');
var path = require('path');
var dfs = require('deferred-fs'), Deferred = dfs.Deferred;
var PATH_TO_NODE = process.execPath;

exports.mixin = function(target /*, src..*/) {
	Array.prototype.slice.call(arguments, 1).forEach(function(source) {
		var keys = Object.keys(source);
		for (var i=0; i < keys.length; i++) {
			var key = keys[i];
			target[key] = source[key];
		}
	});
	return target;
};

/**
 * @param {Array} argv
 * @returns {Object}
 */
exports.parseArgs = function(argv) {
	argv = argv.slice(2); // skip 'node', 'index.js'
	var args = {}, match;
	for (var i=0; i < argv.length; i++) {
		if ((match = /-([^\-\s]+)/.exec(argv[i]))) {
			var name = match[1], next = argv[i + 1], value;
			if (i + 1 >= argv.length || (next && next.charAt(0) === '-')) {
				value = true; // boolean argument: -foo
			} else {
				value = next; // argument followed by value: -foo 25
			}
			args[name] = value;
		}
	}
	return args;
};

/**
 * @param {dirs} Directories to be created (if not already existing). Non-existent dirs are created serially, so subdirs of an earlier 
 * entry can appear later in the list.
 * @returns {orion.Promise} A promise resolving to the input dirs.
 */
exports.ensureDirsExist = function(dirs, callback) {
	return async.sequence(dirs.map(function(dir) {
		return function() {
			return dfs.exists(dir).then(function(exists) {
				if (!exists) {
					return dfs.mkdir(dir);
				}
				return new Deferred().resolve(dir);
			});
		};
	})).then(function() {
		return dirs;
	});
};

/**
 * @returns {orion.Promise} Returns a promise resolving to the the config file params (or <code>null</code>).
 */
var checkNpmPath = exports.checkNpmPath = function(config) {
	var result = config, npm_path_guess_list = [];
	if(result && result.npm_path){
		var npmPath = result.npm_path;
		if(npmPath.indexOf("./") === 0 || npmPath.indexOf("../") === 0){
			npmPath = path.dirname(PATH_TO_NODE) + "/" + npmPath;
		}
		npm_path_guess_list.push(npmPath);
	}
	if(!result){
		result = {};
	}
	var found = null;

	npm_path_guess_list.push(path.dirname(PATH_TO_NODE) + "/" + "../lib/node_modules/npm/bin/npm-cli.js");
	npm_path_guess_list.push(path.dirname(PATH_TO_NODE) + "/" + "./node_modules/npm/bin/npm-cli.js");
    var promises = [];
	npm_path_guess_list.forEach(function(guess) {
		promises.push(function(){
			if(!found){
				return dfs.exists(guess).then(function(exists){
					if(exists){
						found = guess;
					} 
					return found;
				});
			} else {
				return found;
			}
		});
	});
	return async.sequence(promises).then(function(existingGuess){
		if(!existingGuess) {
			result.npm_path = null;
			var errorMessage = "Could not find npm in the following locations:\n"
				+ npm_path_guess_list.join("\n")
				+ "Please add or modify the npm_path in the orion.conf file and restart the server.\n";
			console.log(errorMessage);
			result.npm_error_message = errorMessage + "For details refer to [how to config npm path](http://wiki.eclipse.org/Orion/Getting_Started_with_Orion_node#Making_sure_Orionode_can_launch_npm)\n";
		} else {
			result.npm_path = existingGuess;
		}
		return result;
	});
};

/**
 * @returns {orion.Promise} A promise resolving to <code>Object</code> giving the config file params. The value is <code>null</code> if the file couldn't be read.
 */
exports.readConfigFile = function(configFile, callback) {
	var promise = configFile ? dfs.readFile(configFile, 'utf8') : new Deferred().resolve();
	return promise.then(function(content) {
		if (!content) {
			return null;
		}
		var result = {};
		var params = content.split(/\r?\n/);
		params.forEach(function(pair, i) {
			if (String.prototype.trim.call(pair).charAt(0) === '#') {
				return;
			}
			var parsed = /([^=]*)(=?)(.*)/.exec(pair);
			var name = parsed[1] || "";
			var value = parsed[3] || "";
			if (name !== "") {
				value = (value === "true") ? true : value;
				value = (value === "false") ? false: value;
				value = !isNaN(parseInt(value, 10)) ? parseInt(value, 10) : value;
				result[name] = value;
			}
		});
		return result;
	})/*.then(checkNpmPath)*/;
};

/**
 * Allows mock values of process.argv to be set and read from environment variables.
 */
function forEachArgument(func) {
	Object.keys(process.env).forEach(function(key) {
		var m;
		if ((m = /ARGV_(\d+)/.exec(key)) !== null) {
			func(process.env[key], m[1]);
		}
	});
}
Object.defineProperty(exports, 'testArgv', {
	set: function(val) {
		if (Array.isArray(val)) {
			val.forEach(function(arg, i) {
				process.env['ARGV_' + i] = arg;
			});
		} else if (val === null || typeof val === 'undefined') {
			forEachArgument(function(arg, i) {
				delete process.env['ARGV_' + i];
			});
		}
	},
	get: function() {
		var argv = [];
		forEachArgument(function(value, i) {
			argv[i] = value;
		});
		return argv.length ? argv : null;
	}
});

