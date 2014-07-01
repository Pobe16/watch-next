'use strict';
var conFig = {
	youTubeApiKey : 'yeah, right',
	
	contextMenu : {
		"title": "Watch Next",
		"contexts": ["link"],
		"targetUrlPatterns": ["*://*.youtube.com/watch*", "*://*.youtu.be/*"],
		"id": "watchNext",
	},

	//checks if the localStorage is initialised, do so if not
	startLS: function() {
		if (!localStorage.hasOwnProperty('watchNextPlaylist')){
			localStorage.watchNextPlaylist = '[]';
		}
		if (!localStorage.hasOwnProperty('watchNext')){
			localStorage.watchNext = 'true';
		}
	},

	//shortcut for the normalization of array-like elements
	DOMtoArray: function(DOM){
		return Array.prototype.slice.call(DOM);
	},

	//shortcut for creating DOM elements with class
	insert: function(tag, clas){
		var html = document.createElement(tag);
		if (clas){
			html.className = clas;	
		}
		return html;
	}
};