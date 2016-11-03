'use strict';
(function(){

var button = {
	linksArray: [],
	nextButtonsArray: [],
	linkType: '',

	//selecting thumbnails to work with
	setLinksArray: function() {
		var toConvert = document.getElementsByClassName('thumb-link'),
			element;
		if (toConvert.length === 0) {
			toConvert = document.getElementsByClassName('addto-watch-later-button');
			this.linkType = 'button';
		} else {
			this.linkType = 'thumbnail';
		}
		this.linksArray = conFig.DOMtoArray(toConvert);
		for (var i = this.linksArray.length-1; i > -1; i--) {
			element = this.linksArray[i];
			if (element.classList.contains('watch-next-button-created')) {
				this.linksArray.splice(i, 1);
			}
		}
	},
	
	//selecting buttons to assign onclick events
	setButtonArray: function() {
		var toConvert = document.getElementsByClassName('addto-watch-next-button'),
			element;

		this.nextButtonsArray = conFig.DOMtoArray(toConvert);
		for (var i = this.nextButtonsArray.length-1; i > -1; i--) {
			element = this.nextButtonsArray[i];
			if (element.classList.contains('watch-next-clickable')) {
				this.nextButtonsArray.splice(i, 1);
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
 				element.blur();
 			}
 		});
 	},

 	//button template to imitate youtube behavior
	createButtonTemplate: function(id){
		var tempButton = document.createDocumentFragment(),
			template = {
				button : conFig.insert('button'),
				span: conFig.insert('span', 'yt-uix-button-content'),
				img: conFig.insert('img')
			};

		//setting attributes
		if (button.linkType === 'thumbnail') {
			template.button.classList = 'yt-uix-tooltip yt-uix-button-default addto-watch-next-button';
		} else if (button.linkType === 'button') {
			template.button.classList = 'addto-button video-actions yt-uix-tooltip yt-uix-button-default addto-watch-next-button';
		}

	 	template.img.src = chrome.extension.getURL('icons/icon_add_16.png');
	 	template.img.alt = 'Watch Next';
	 	template.button.title = 'Watch Next';
	 	template.button.type = 'button';
	 	template.button.setAttribute('onclick', ';return false;');
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
 		//extracting video id from the href of link
 		var tempVideoId,
 			parentDiv = element.parentNode,
			watchNextButton;
		if (button.linkType === 'thumbnail') {
			tempVideoId = element.getAttribute('href').slice(9);
			watchNextButton = button.createButtonTemplate(tempVideoId);
			parentDiv.insertBefore(watchNextButton, parentDiv.childNodes[3].nextSibling);
		} else if (button.linkType === 'button') {
			tempVideoId = element.getAttribute('data-video-ids');
			watchNextButton = button.createButtonTemplate(tempVideoId);
			parentDiv.insertBefore(watchNextButton, element);
		}
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
 		button.setLinksArray();

		//where there is a thumbnail for next video, we can add our own button
		button.linksArray.forEach(button.insertButton);

		button.setButtonArray();

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