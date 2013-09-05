/*******************************************************************************
 * @license
 * Copyright (c) 2012, 2013 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define*/
define([
	'orion/assert',
	'orion/Deferred',
	'orion/EventTarget',
	'orion/objects',
	'orion/serviceregistry',
	'orion/edit/ast'
], function(assert, Deferred, EventTarget, objects, mServiceRegistry, ASTManager) {
	var ServiceRegistry = mServiceRegistry.ServiceRegistry;

	var tests = {};

	tests['test AST is provided upon request'] = function() {
		var serviceRegistry = new ServiceRegistry(),
		    inputManager = {},
		    astManager = new ASTManager(serviceRegistry, inputManager);
		// TODO
		// mock Editor 
		// mock InputManager (maybe unnecessary if we have a mock Editor?)

		var astProvider = {
			getAST: function(context) {
				return { ast: 'this is the AST' };
			}
		};

		var promise = new Deferred();
		var contentAssistProvider = {
			computeProposals: function(editorServices, context) {
				return editorServices.getAST().then(function(ast) {
					
				});
			}
		};

		serviceRegistry.registerService("orion.core.astprovider", astProvider, { contentType: ['text/foo'] });
		serviceRegistry.registerService("orion.edit.contentAssist", contentAssistProvider, { contentType: ['text/foo'] });
		// set the inputManager's contentType to foo
		// Cause an editor changed
		return promise;
	};
	tests['test AST cache is used'] = function() {
		
	};
	tests['test AST cache cleared after change'] = function() {
		// As above, but ensure cached AST is discarded given after an InputChanged
	};

	return tests;
});