'use strict';
(function(){

var nextButtonClass = 'addto-watch-next-button',
	nextButtonArray,
	//we are using existing youtube features to use their css tricks
	laterButtonClass = 'addto-watch-later-button',
	laterButtonsArray = document.getElementsByClassName(laterButtonClass),
	button = {
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
		buttonTemplate: function(id){
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
				watchNextButton = button.buttonTemplate(tempVideoId);
			parentDiv.insertBefore(watchNextButton, element);
	 	},

	 	makeButtonClickable: function(element){
	 		var tempVideoId = element.getAttribute('data-video-ids');
	 		element.addEventListener('click', function(){
	 			button.addVideoToPlaylist(tempVideoId, element);
	 		});
	 	}
	};


/*
I wanted to put an event listener for DOMContentLoaded, but Chrome starts 
content scripts after that event.
*/
laterButtonsArray = conFig.DOMtoArray(laterButtonsArray);

//where there is a watch later button, we can add our own
laterButtonsArray.forEach(button.insertButton);

/*
we can't initialize it with value at the beginning
because our watch next buttons don't exist then
*/
nextButtonArray = document.getElementsByClassName(nextButtonClass);
nextButtonArray = conFig.DOMtoArray(nextButtonArray);

//on-click action for buttons
nextButtonArray.forEach(button.makeButtonClickable);

}());