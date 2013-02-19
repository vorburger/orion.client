/*******************************************************************************
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*global __dirname console process require describe it before beforeEach after afterEach*/
var assert = require('assert');
var mocha = require('mocha');
var request = require('supertest');

var connect = require('connect');
var path = require('path');
var args = require('../lib/args');
var testData = require('./support/test_data');

var WORKSPACE = path.join(__dirname, '.test_workspace');

var orion = require('../');

// FIXME this is quite dodgy
function unrequire(moduleName) {
	var cacheEntry = require.cache[require.resolve(moduleName)];
	if (cacheEntry) {
		delete require.cache[cacheEntry.id];
	}
}

describe('orionode', function() {
	function byName(a, b) {
		return String.prototype.localeCompare(a.Name, b.Name);
	}

	beforeEach(function(done) {
		testData.setUp(WORKSPACE, done);
	});

	describe('middleware', function() {
		var app;
		beforeEach(function() {
			app = testData.createApp();
		});

		// Make sure that we can .use() the orion server as a connect module.
		it('exports #createServer', function(done) {
			app.use(orion({
				workspaceDir: WORKSPACE
			}))
			.request()
			.get('/file/project/fizz.txt')
			.expect(200, 'hello world', done);
		});
		// Sanity check to ensure the orion client code is being mounted correctly
		it('finds the orion.client code', function(done) {
			app.use(orion({
				workspaceDir: WORKSPACE
			}))
			.request()
			.get('/navigate/table.html')
			.expect(200)
			.end(function(err, res) {
				assert.ifError(err);
				done();
			});
		});
	});

	describe('command line', function() {
		var app;
		before(function(done) {
			// Env variables used for testing server.js
			args.testArgv = [ '/bogus/node.exe', '/ignored/server.js', '-workspace', path.join(WORKSPACE, 'project') ];

			require('../server').then(function(startedApp) {
				app = startedApp;
				done();
			});
		});
		after(function() {
			args.testArgv = null;
			app.close();
			// This is rather bogus
			unrequire('../server');
		});

		it('respects -workspace argument', function(done) {
			request(app)
				.get('/workspace')
				.expect(200, function(err, res) {
					assert.ifError(err);
					request(app).get(res.body.Workspaces[0].Location)
					.expect(200, function(err, res) {
						assert.ifError(err);
						console.log('body; ' + JSON.stringify(res.body));
						res.body.Children.sort(byName);
						assert.ok(Array.isArray(res.body.Children));
						assert.equal(res.body.Children[0].Name, 'fizz.txt');
						assert.equal(res.body.Children[1].Name, 'my folder');
						done();
					});
				});
		});
	});

	describe('orion.conf', function() {
		before(function() {
			process.env.TEST_CONFIG_FILE = path.join(__dirname, 'orion-test.conf');
			// TODO
			// workspace=./test/.test_workspace/project/my folder/
		});
		after(function() {
			delete process.env.TEST_CONFIG_FILE;
		});

		it('respects "workspace" in config file', function(done) {
			require('../server').then(function(app) {
				request(app)
					.get('/workspace')
					.expect(200, function(err, res) {
						assert.ifError(err);
						request(app).get(res.body.Workspaces[0].Location)
						.expect(200, function(err, res) {
							assert.ifError(err);
							console.log('body; ' + JSON.stringify(res.body));
							res.body.Children.sort(byName);
							assert.ok(Array.isArray(res.body.Children));
							assert.equal(res.body.Children[0].Name, 'buzz.txt');
							assert.equal(res.body.Children[1].Name, 'my subfolder');
							done();
						});
					});
			});
		});
	});
});