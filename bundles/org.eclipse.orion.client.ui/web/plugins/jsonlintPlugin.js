/*******************************************************************************
 * @license
 * Copyright (c) 2013 Michael Vorburger and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     Michael Vorburger - initial API and implementation
 *******************************************************************************/
/*global console define CSSLint*/
define(['orion/plugin', 'plugins/csslintPlugin/lib/csslint'], function(PluginProvider, _) {
	// TODO swap csslint to jsonlint
	
	console.log("Installing jsonlintPlugin..."); // TODO remove
	
	function _computeProblems(contents) {
		var problems = [];
		try {
			JSON.parse(contents);
		} catch (e) {
			console.log('jsonlint failed: ' + e); // TODO remove later...
			var problem = {
					description: e,
					// line: 1,
					start: 1,
					// end: contents.length,
					severity: "error"
				};
			problems.push(problem);
		}
/*		
			jsonResult = JSON.parse(contents),  // TODO CSSLint.verify(contents),
		    messages = jsonResult.messages,
		    lines = contents.split(/\r?\n/);
		    
		for (var i=0; i < messages.length; i++) {
			var message = messages[i];
			if (message.line) {
				var lineText = lines[message.line - 1];
				var problem = {
					description: message.message,
					line: message.line,
					start: message.col,
					end: lineText.indexOf(message.evidence) + message.evidence.length,
					severity: message.type
				};
				problems.push(problem);
		}
*/		
		return {problems: problems};
	}
/*	
//	function addOutlineRule(/ **Array* / outline) {
		CSSLint.addRule({
			id: "css-outline",
			name: "CSS outline",
			desc: "CSS outline helper rule",
			browsers: "All",
			init: function(parser, reporter) {
				outline.length = 0;
				
				// Pushes selector info into the outline
				parser.addListener("startrule", function(event) {
					var selectors = event.selectors;
					if (selectors && selectors.length) {
						var selectorText = [], line = null, col = null;
						for (var i=0; i < selectors.length; i++) {
							var sel = selectors[i];
							if (line === null) { line = sel.line; }
							if (col === null) { col = sel.col; }
							selectorText.push(sel.text);
						}
						outline.push({
							label: selectorText.join(", "),
							line: line,
							col: col
						});
					}
				});
			}
		});
	}
*/
	try {
		var headers = {
			name: "Orion JSONLint Support",
			version: "1.0",
			description: "This plugin provides a JSONLint service to support validation of JSON files."
					  // "This plugin provides a JSONLint service to support outline and validation of JSON files."
		};

		var provider = new PluginProvider(headers);
		// Register validator
		provider.registerService("orion.edit.validator",
			{
				computeProblems: function(editorContext, context) {
					return editorContext.getText().then(_computeProblems);
				}
			},
			{
				contentType: ["application/json", "text/json", "text/x-json"]
			});
/*
		// Register outline provider
		var cssOutline = [];
		addOutlineRule(cssOutline);
		provider.registerService("orion.edit.outliner",
			{
				getOutline: function(contents, title) {
					CSSLint.verify(contents);
					return cssOutline;
				}
			}, {
				id: "orion.outline.css.csslint",
				name: "CSS rule outline",
				contentType: ["text/css"]
			});
*/			
		provider.connect();
	} catch (e) {
		console.log("Couldn't install jsonlintPlugin: " + e);
	}
	console.log("Installed jsonlintPlugin."); // TODO remove
});