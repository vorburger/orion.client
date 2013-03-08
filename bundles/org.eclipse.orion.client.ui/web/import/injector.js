/*******************************************************************************
 * @license
 * Copyright (c) 2013 IBM Corporation and others.
 * All rights reserved.
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define console window*/
define(['require', 'orion/Deferred', 'orion/xhr', 'orion/form', 'orion/URL-shim'], function(require, Deferred, xhr, form, _) {
	function debug(msg) { console.log('orion injector: ' + msg); }

	function Injector(fileClient, usersClient) {
		this.fileClient = fileClient;
		this.usersClient = usersClient;
	}
	Injector.prototype.inject = function(user, projectZipData) {
		var fileClient = this.fileClient;
		var usersClient = this.usersClient;
		var createUserAndLogin = function() {
			var d = new Deferred();
			var randomSuffix = String(Math.random()).substring(2, 12);
			var username = user.Name + randomSuffix, password = user.Password, email = user.Email + randomSuffix;
			usersClient.createUser(username, password, email).then(function(r) {
				debug('user created');
				d.resolve(r);
			}).then(function(user) {
				// TODO there is no way to login automatically via a service so it's hardcoded :(
				debug('logging in...');
				return xhr('POST', require.toUrl('login/form'), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Orion-Version': '1'
					},
					data: form.encodeFormData({
						login: username,
						password: password
					})
				});
			}).then(function(user) {
				// get logged-in-user
				// FIXME redundant
				return user;
			});
			return d;
		};
		// Creates project if necessary, and returns its metadata
		var ensureProjectExists = function(location, name) {
			return fileClient.createProject(location, name).then(function(p) {
				console.log('Created project: ' + p.Location);
				return fileClient.read(p.ContentLocation, true);
			}, function(e) {
				e = e.response || e;
				// This is awful, but there's no better way to check if a project exists?
				if (typeof e === 'string' && e.toLowerCase().indexOf('duplicate') !== -1) {
					return fileClient.read(location, true).then(function(workspace) {
						var projects = workspace.Children, project;
						projects.some(function(p) {
							if (p.Name === name) {
								project = p;
								console.log('Got existing project: ' + p.Location);
								return true;
							}
						});
						return project || new Deferred().reject(e);
					});
				}
				return new Deferred.reject(e);
			});
		};
		var uploadZip = function(importLocation, zipData) {
			// TODO why don't file service impls support this??
			return xhr('POST', importLocation, {
				headers: {
					Slug: 'data.zip' // Doesn't matter -- will be unzipped anyway
				},
				data: zipData
			});
		};

		return createUserAndLogin().then(function() {
			return fileClient.loadWorkspace().then(function(workspace) {
				console.log('loaded workspace ' + workspace.Location);
				return ensureProjectExists(workspace.ChildrenLocation, 'Code Samples').then(function(project) {
					return fileClient.read(project.ChildrenLocation, true).then(function(projectMetadata) {
						console.log('Unzipping (importing) to ' + projectMetadata.ImportLocation);
						return uploadZip(projectMetadata.ImportLocation, projectZipData).then(function() {
							return projectMetadata;
						});
					});
				});
			});
		});
	};
	return Injector;
});