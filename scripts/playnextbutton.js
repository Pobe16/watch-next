'use strict';
(function(){

var button = {
	//we are using existing youtube features to use their css tricks
	laterButtonClass: 'addto-watch-later-button',
	laterButtonsArray: [],
	nextButtonClass: 'addto-watch-next-button',
	nextButtonsArray: [],

	setArray: function(which) {
		var a = 'ButtonsArray',
			c = 'ButtonClass',
			toConvert = document.getElementsByClassName(this[which+c]),
			isItDone,
			element;
			
		if (which === 'later'){
			isItDone = 'watch-next-button-created';
		}else if (which === 'next' ){
			isItDone = 'watch-next-clickable';
		}

		this[which+a] = conFig.DOMtoArray(toConvert);

		for (var i = this[which+a].length-1; i> -1; i--) {
			element = this[which+a][i];				
			if (element.classList.contains(isItDone)) {
				this[which+a].splice(i, 1);
			}
		}
	},
	
	//sends message to background.js to add video to playlist
 	addVideoToPlaylist: function(id, element){
 		chrome.runtime.sendMessage({whatToDo: 'addVideoToPlaylist', videoId: id}, function(response) {
 			if (response.added) {
 				var img = element.childNodes[0].childNodes[0];
 				element.title = 'Video added';
 				element.setAttribute('data-tooltip-text', 'Video added');
 				img.src = chrome.extension.getURL('icons/icon_done_16.png');
 				img.alt = 'Video added';
 			}
 		});
 	},

 	//button template to imitate youtube behavior
	createButtonTemplate: function(id){
		var style = 'right:26px;width:22px;height:22px;padding:0;border-radius:2px;',
			classes = 'addto-button video-actions spf-nolink hide-until-delayloaded addto-watch-next-button yt-uix-button yt-uix-button-default yt-uix-button-size-small yt-uix-tooltip',
			tempButton = document.createDocumentFragment(),
			template = {
				button : conFig.insert('button', classes),
				span: conFig.insert('span', 'yt-uix-button-content'),
				img: conFig.insert('img')
			};

		//setting attributes
	 	template.img.src = chrome.extension.getURL('icons/icon_add_16.png');
	 	template.img.alt = 'Watch Next';
	 	template.button.title = 'Watch Next';
	 	template.button.type = 'button';
	 	template.button.setAttribute('onclick', ';return false;');
	 	template.button.setAttribute('style', style);
	 	template.button.setAttribute('data-video-ids', id);
	 	template.button.setAttribute('role', 'button');

	 	//glueing together
	 	template.span.appendChild(template.img);
	 	template.button.appendChild(template.span);
	 	tempButton.appendChild(template.button);

	 	return tempButton;
 	},

 	// inserts a watch next button on every thumbnail containing the watch later button
 	insertButton: function(element){
 		var tempVideoId = element.getAttribute('data-video-ids'),
 			parentDiv = element.parentNode,
			watchNextButton = button.createButtonTemplate(tempVideoId);
		parentDiv.insertBefore(watchNextButton, element);
		element.classList.add('watch-next-button-created');
 	},

 	makeButtonClickable: function(element){
 		var tempVideoId = element.getAttribute('data-video-ids');
 		element.addEventListener('click', function(){
 			button.addVideoToPlaylist(tempVideoId, element);
 		});
 		element.classList.add('watch-next-clickable');
 	},
 	
 	init: function(){
 		button.setArray('later');

		//where there is a watch later button, we can add our own
		button.laterButtonsArray.forEach(button.insertButton);

		button.setArray('next');

		//on-click action for buttons
		button.nextButtonsArray.forEach(button.makeButtonClickable);
		window.setTimeout(function(){button.init();}, 5000);
 	}
};

/*
Normally I would put here an event listener for DOMContentLoaded,
but Chrome starts content scripts after that event.
*/
button.init();

}());