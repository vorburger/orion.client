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
	'js-tests/editor/mockTextView',
	'orion/assert',
	'orion/edit/ast',
	'orion/Deferred',
	'orion/editor/editor',
	'orion/EventTarget',
	'orion/inputManager',
	'orion/objects',
	'orion/serviceregistry'
], function(mMockTextView, assert, ASTManager, Deferred, mEditor, EventTarget, mInputManager, objects, mServiceRegistry) {
	var Editor = mEditor.Editor,
	    InputManager = mInputManager.InputManager,
	    MockTextView = mMockTextView.MockTextView,
	    ServiceRegistry = mServiceRegistry.ServiceRegistry;

	function setup() {
		var serviceRegistry = new ServiceRegistry();
		var inputManager = new InputManager({
			serviceRegistry: serviceRegistry,
			editor: new Editor({
				textViewFactory: function() {
					return new MockTextView();
				}
			})
//			fileClient: fileClient,
//			progressService: progressService,
//			selection: selection,
//			contentTypeRegistry: contentTypeRegistry
		});
		return {
			serviceRegistry: serviceRegistry,
			inputManager: inputManager,
			astManager: new ASTManager(serviceRegistry, inputManager)
		};
	}

	var tests = {};
	tests.test_getAST = function() {
		var result = setup(),
		    serviceRegistry = result.serviceRegistry,
		    inputManager = result.inputManager;

		serviceRegistry.registerService("orion.core.astprovider", {
				getAST: function(context) {
					return { ast: "this is the AST" };
				}
			}, { contentType: ["text/foo"] });

		// Kick off the fun
		var astManager = serviceRegistry.getService("orion.core.astmanager");
		inputManager.dispatchEvent({ type: "ContentTypeChanged", contentType: {id: "text/foo"} });
		var promise = astManager.getAST().then(function(ast) {
			assert.equal(ast.ast, "this is the AST");
		});
		
		return promise;
	};
	tests.test_getAST_options = function() {
		
	};
	tests.test_AST_cache_is_used = function() {
		// TODO
		//inputManager.getEditor().setText("a");
	};
	tests.test_AST_cache_is_invalidated = function() {
		// As above, but ensure cached AST is discarded given after a model change
		//inputManager.getEditor().setText("a");
	};

	return tests;
});