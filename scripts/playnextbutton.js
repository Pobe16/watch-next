'use strict';
(function(){

var button = {
	linksArray: [],
	nextButtonsArray: [],
	linkType: '',
	//element needed to know if we are on video page
	videoTitle: null,

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
	//also deals with deleting recently added video
 	addVideoToPlaylist: function(id, element, current){
 		var size = 0;
 		if (current) {
 			size = 22;
 		} else {
 			size = 16;
 		}
 		if (id === null){
 			id = element.getAttribute('data-video-ids');
 		}
 		if (element.classList.contains('watch-next-added-to-playlist')){
 			if (element.classList.contains('watch-next-delete-confirmation')){
 				chrome.runtime.sendMessage({whatToDo: 'deleteRecentlyAddedVideo'}, function() {
 					button.renew(element, size);
 				});
 			}else{
				element.classList.add('watch-next-delete-confirmation');
				var img = element.childNodes[0].childNodes[0];
 				element.title = 'Delete video?';
 				element.setAttribute('data-tooltip-text', 'Delete video?');
 				img.src = chrome.extension.getURL('icons/icon_delete_' + size + '.png');
	 			img.alt = 'Delete video?';
 				element.blur();
 			}
 		} else {
 			element.classList.add('watch-next-added-to-playlist');
 			chrome.runtime.sendMessage({whatToDo: 'addVideoToPlaylist', videoId: id}, function(response) {
	 			if (response.added) {
 					var img = element.childNodes[0].childNodes[0];
 					element.title = 'Video added';
 					element.setAttribute('data-tooltip-text', 'Video added');
 					img.src = chrome.extension.getURL('icons/icon_done_' + size + '.png');
	 				img.alt = 'Video added';
 					element.blur();
 				}
 			});
 		}
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
		//this works for the links on watch page
		if (button.linkType === 'thumbnail') {
			tempVideoId = element.getAttribute('href').slice(9);
			watchNextButton = button.createButtonTemplate(tempVideoId);
			
			//this one worked before the 13/02/2017
			//parentDiv.insertBefore(watchNextButton, parentDiv.childNodes[0].nextSibling);
			
			parentDiv.appendChild(watchNextButton);
		//this works for the links everywhere else on youtube
		} else if (button.linkType === 'button') {
			tempVideoId = element.getAttribute('data-video-ids');
			watchNextButton = button.createButtonTemplate(tempVideoId);
			parentDiv.insertBefore(watchNextButton, element);
		}
		element.classList.add('watch-next-button-created');
 	},

 	makeButtonClickable: function(element){
 		var tempVideoId = element.getAttribute('data-video-ids');
 		element.addEventListener('click', function(event){
 			event.stopPropagation();
 			event.preventDefault();
 			button.addVideoToPlaylist(tempVideoId, element, false);
 		});
 		element.classList.add('watch-next-clickable');
 		element.parentNode.addEventListener('mouseleave', function(){
 			if (element.classList.contains('watch-next-added-to-playlist')) {
 				element.parentNode.parentNode.parentNode.classList.add('watch-next-button-video-in-playlist');
 			}
 			button.renew(element, 16);
 		});
 	},

 	renew: function(element, size) {
 		if (element.classList.contains('watch-next-added-to-playlist')){
	 		var img = element.childNodes[0].childNodes[0];
 			element.title = 'Watch Next';
 			element.setAttribute('data-tooltip-text', 'Watch Next');
	 		img.src = chrome.extension.getURL('icons/icon_add_' + size + '.png');
 			img.alt = 'Watch Next';
 			element.classList.remove('watch-next-added-to-playlist');
 			element.classList.remove('watch-next-delete-confirmation');
 			element.blur();
 		}
 	},

 	lookingForDescription: function(){
 		button.videoTitle = document.getElementById('watch-headline-title');
	 	if (button.videoTitle) {
 			if (button.videoTitle.classList.contains('watch-next-controls-added')){
 				//I don't think there should be anything here - it's the end for my empty loop...
 			} else {
 				button.videoTitle.classList.add('watch-next-controls-added');
 				button.insertControls();
 			}
 		}
 	},

 	insertControls: function(){
 		var tempControls = document.createDocumentFragment();
 		tempControls.appendChild(conFig.insert('div', 'watch-next-controls'));
 		button.videoTitle.appendChild(tempControls);
 		tempControls = document.getElementsByClassName('watch-next-controls')[0];
 		tempControls.appendChild(button.createAddThisButton());
 		tempControls.appendChild(button.createPlayNextButton());

 		var addVideoButton = document.getElementById('watch-next-controls-add-this-video');
 		button.addVideoIdToPlayNextButton();
 		addVideoButton.addEventListener('click', button.addVideoButtonOnClick);
 		button.videoTitle.parentNode.parentNode.addEventListener('mouseleave', button.resetAddToPlaylistButton);
 	},

 	createAddThisButton: function() {
 		var tempButton = document.createDocumentFragment(),
			template = {
				button : conFig.insert('button'),
				span: conFig.insert('span', 'yt-uix-button-content'),
				img: conFig.insert('img'),
				},
			id = conFig.youtubeParser(window.location.href);
		template.button.classList = 'yt-uix-tooltip yt-uix-button-default';
		template.img.src = chrome.extension.getURL('icons/icon_add_22.png');
	 	template.img.alt = 'Watch Next';
	 	template.button.title = 'Watch Next';
	 	template.button.type = 'button';
	 	template.button.setAttribute('onclick', ';return false;');
	 	template.button.setAttribute('data-video-ids', id);
	 	template.button.setAttribute('role', 'button');
	 	template.button.setAttribute('id', 'watch-next-controls-add-this-video');

	 	template.span.appendChild(template.img);
	 	template.button.appendChild(template.span);
	 	tempButton.appendChild(template.button);

	 	return tempButton;
 	},

 	createPlayNextButton: function(){
 		var tempButton = document.createDocumentFragment(),
			template = {
				button : conFig.insert('button'),
				span: conFig.insert('span', 'yt-uix-button-content'),
				img: conFig.insert('img'),
				};
			
			//setting attributes
	 	template.button.classList = 'yt-uix-tooltip yt-uix-button-default watch-next-controls-play-next-video';
		template.img.src = chrome.extension.getURL('icons/icon_fwd_22.png');
	 	template.img.alt = 'Play next item from your Watch Next playlist';
	 	template.button.title = 'Play next item from your Watch Next playlist';
	 	template.button.type = 'button';
	 	template.button.setAttribute('onclick', ';return false;');
	 	template.button.setAttribute('role', 'button');

	 	//glueing together
	 	template.span.appendChild(template.img);
		template.button.appendChild(template.span);
	 	tempButton.appendChild(template.button);

	 	return tempButton;
	},

	addVideoIdToPlayNextButton: function() {
		var element = document.getElementsByClassName('watch-next-controls-play-next-video')[0];
		chrome.runtime.sendMessage({whatToDo: 'getNextVideoId', button: true}, function(response) {
			if (response.videoId) {
				button.makePlayNextButtonClickable(response.videoId, element);
			} else  {
				if (element) {
					button.deletePlayNextButton();
				}
			}			
		});
	},

	makePlayNextButtonClickable: function(id, element) {
		element.setAttribute('data-video-ids', id);
		element.addEventListener('click', button.playNextButtonOnClick);
	},

	playNextButtonOnClick: function(){
		var element = document.getElementsByClassName('watch-next-controls-play-next-video')[0],
			id = element.getAttribute('data-video-ids');
		button.playNextVideoFromPlaylist(id);
	},

	playNextVideoFromPlaylist: function(id) {
		chrome.runtime.sendMessage({whatToDo: 'videoWatched', videoId: 0}, function(){});
		document.location.href = 'https://www.youtube.com/watch?v='+id+'&feature=watchnext';
	},

	deletePlayNextButton: function() {
		var el = document.getElementsByClassName('watch-next-controls-play-next-video')[0];
		if (el) {
			el.parentNode.removeChild(el);	
		}
	},

	addVideoButtonOnClick: function(){
		var element = document.getElementById('watch-next-controls-add-this-video');
		button.addVideoToPlaylist(null, element, true);
	},

	rebuildControls: function() {
		var element = document.getElementsByClassName('watch-next-controls-play-next-video')[0];
		if (element){
			element.removeEventListener('click', button.playNextButtonOnClick);
			button.addVideoIdToPlayNextButton();
		} else {
		var node = document.getElementsByClassName('watch-next-controls')[0];
		node.appendChild(button.createPlayNextButton());
		button.addVideoIdToPlayNextButton();
		}
	},

	resetAddToPlaylistButton: function(){
		var element = document.getElementById('watch-next-controls-add-this-video');
		if (element.classList.contains('watch-next-added-to-playlist')){
			button.videoTitle.parentNode.classList.add('watch-next-button-video-in-playlist');
		}
		button.renew(element, 22);
	},

 	init: function(){
 		button.setLinksArray();

		//where there is a thumbnail for next video, we can add our own button
		button.linksArray.forEach(button.insertButton);

		button.setButtonArray();

		//on-click action for buttons
		button.nextButtonsArray.forEach(button.makeButtonClickable);

		button.lookingForDescription();

		window.setTimeout(function(){button.init();}, 5000);


 	}
},
newLook = {
	oldUrl: "",
	linksArray: null,
	nextButtonsArray: null,
	videoTitle: null,

	//selecting thumbnails to work with
	setLinksArray: function() {
		// var toConvert = document.querySelectorAll("ytd-thumbnail-overlay-toggle-button-renderer"),
		var toConvert = document.querySelectorAll("#thumbnail"),
			element;
		this.linksArray = conFig.DOMtoArray(toConvert);
		for (var i = this.linksArray.length-1; i > -1; i--) {
			element = this.linksArray[i];
			if (element.classList.contains('watch-next-button-created')||element.classList.contains('new-look-addto-watch-next-button') || element.classList.contains('ytd-moving-thumbnail-renderer')){
				this.linksArray.splice(i, 1);
			}
		}
	},

	insertButton: function(element){
 		//extracting video id from the href of link
 		var tempVideoId,
 			parentDiv = element.parentNode,
			watchNextButton;

		// tempVideoId = element.parentNode.parentNode.getAttribute('href').slice(9,20);
		if (element.getAttribute('href') && element.getAttribute('href').length > 0){
			tempVideoId = element.getAttribute('href').slice(9,20);
			watchNextButton = newLook.createButtonTemplate(tempVideoId);
			parentDiv.appendChild(watchNextButton);

			//indicate this thumbnail already have the button created for it:
			element.classList.add('watch-next-button-created');
		}

 	},

 	createButtonTemplate: function(id){
		var tempButton = document.createDocumentFragment(),
			template = {
				button : conFig.insert('div', 'new-look-addto-watch-next-button style-scope'),
				img: conFig.insert('img', 'style-scope')
			};

	 	template.img.src = chrome.extension.getURL('icons/icon_add_22.png');
	 	template.img.alt = 'Watch Next';
	 	template.button.title = 'Watch Next';
	 	template.button.setAttribute('onclick', ';return false;');
	 	template.button.setAttribute('tabindex', '0');
	 	template.button.setAttribute('role', 'button');
	 	template.button.setAttribute('data-video-ids', id);

	 	//glueing together
	 	template.button.appendChild(template.img);

	 	tempButton.appendChild(template.button);

	 	return tempButton;
 	},

 	setButtonArray: function() {
		var toConvert = document.getElementsByClassName('new-look-addto-watch-next-button'),
			element;

		this.nextButtonsArray = conFig.DOMtoArray(toConvert);
		for (var i = this.nextButtonsArray.length-1; i > -1; i--) {
			element = this.nextButtonsArray[i];
			if (element.classList.contains('watch-next-clickable')) {
				this.nextButtonsArray.splice(i, 1);
			}
		}
	},

	makeButtonClickable: function(element){
 		//var tempVideoId = element.getAttribute('data-video-ids');
 		element.addEventListener('click', function(){
 			//newLook.addVideoToPlaylist(tempVideoId, element);
 			newLook.addVideoToPlaylist(null, element);
 			event.stopPropagation();
 			event.preventDefault();
 		});
 		element.classList.add('watch-next-clickable');
 		element.parentNode.parentNode.addEventListener('mouseleave', function(){
 			if (element.classList.contains('watch-next-added-to-playlist')) {
 				// element.parentNode.parentNode.parentNode.parentNode.classList.add('watch-next-button-video-in-playlist');
 				element.parentNode.parentNode.classList.add('watch-next-button-video-in-playlist');

 			}
 			newLook.renew(element, 22);
 		});
 	},

 	addVideoToPlaylist: function(id, element){
 		var size = 22;
 		if (id === null){
 			id = element.getAttribute('data-video-ids');
 		}
 		if (element.classList.contains('watch-next-added-to-playlist')){
 			if (element.classList.contains('watch-next-delete-confirmation')){
 				chrome.runtime.sendMessage({whatToDo: 'deleteRecentlyAddedVideo'}, function() {
 					newLook.renew(element, size);
 				});
 			}else{
				element.classList.add('watch-next-delete-confirmation');
	 			//YouTube's new look adds some of it's code into my injected stuff.
				var img = newLook.getImg(element);
 				element.title = 'Delete video?';
 				element.setAttribute('data-tooltip-text', 'Delete video?');
 				img.src = chrome.extension.getURL('icons/icon_delete_' + size + '.png');
	 			img.alt = 'Delete video?';
 				element.blur();
 			}
 		} else {
 			element.classList.add('watch-next-added-to-playlist');
 			chrome.runtime.sendMessage({whatToDo: 'addVideoToPlaylist', videoId: id}, function(response) {
	 			if (response.added) {
	 				//YouTube's new look adds some of it's code into my injected stuff.
 					var img = newLook.getImg(element);
 					element.title = 'Video added';
 					img.src = chrome.extension.getURL('icons/icon_done_' + size + '.png');
	 				img.alt = 'Video added';
 					element.blur();
 				}
 			});
 		}
 	},

 	getImg: function(element){
 		var img = null;
 	//	if (element.classList.contains('watch-next-controls-add-this-video')) {
 				img = element.childNodes[0];
 	//		} else {
	//			img = element.childNodes[2];
	//		}
	 	return img;

 	},

 	renew: function(element, size) {
 		if (element.classList.contains('watch-next-added-to-playlist')){
 			var img = newLook.getImg(element);
 			element.title = 'Watch Next';
	 		img.src = chrome.extension.getURL('icons/icon_add_' + size + '.png');
 			img.alt = 'Watch Next';
 			element.classList.remove('watch-next-added-to-playlist');
 			element.classList.remove('watch-next-delete-confirmation');
 			element.blur();
 		}
 	},

 	lookingForDescription: function(){
 		newLook.videoTitle = document.querySelectorAll('h1.title')[0];
	 	if (newLook.videoTitle) {
 			if (newLook.videoTitle.classList.contains('watch-next-controls-added')){
 				//I don't think there should be anything here - it's the end for my empty loop...
 			} else {
 				newLook.videoTitle.classList.add('watch-next-controls-added');
 				newLook.insertControls();
 			}
 		}
 	},

 	insertControls: function(){
 		var tempControls = document.createDocumentFragment();
 		tempControls.appendChild(conFig.insert('div', 'watch-next-controls style-scope'));
 		newLook.videoTitle.appendChild(tempControls);
 		tempControls = document.getElementsByClassName('watch-next-controls')[0];
 		tempControls.appendChild(newLook.createAddThisButton());
 		tempControls.appendChild(newLook.createPlayNextButton());

 		var addVideoButton = document.getElementById('watch-next-controls-add-this-video');
 		newLook.addVideoIdToPlayNextButton();
 		addVideoButton.addEventListener('click', newLook.addVideoButtonOnClick);
 		newLook.videoTitle.parentNode.parentNode.addEventListener('mouseleave', newLook.resetAddToPlaylistButton);
 	},

 	createAddThisButton: function() {
 		var tempButton = document.createDocumentFragment(),
			template = {
				button : conFig.insert('div', 'watch-next-controls-add-this-video style-scope'),
				img: conFig.insert('img', 'style-scope')
			},
			id = conFig.youtubeParser(window.location.href);
		template.img.src = chrome.extension.getURL('icons/icon_add_22.png');
	 	template.img.alt = 'Watch Next';
	 	template.button.title = 'Watch Next';
	 	template.button.setAttribute('onclick', ';return false;');
	 	template.button.setAttribute('data-video-ids', id);
	 	template.button.setAttribute('id', 'watch-next-controls-add-this-video');

	 	template.button.appendChild(template.img);
	 	tempButton.appendChild(template.button);

	 	return tempButton;
 	},

 	createPlayNextButton: function(){
 		var tempButton = document.createDocumentFragment(),
			template = {
				button : conFig.insert('div', 'watch-next-controls-play-next-video style-scope'),
				img: conFig.insert('img', 'style-scope')
			};
			
		//setting attributes
		template.img.src = chrome.extension.getURL('icons/icon_fwd_22.png');
	 	template.img.alt = 'Play next item from your Watch Next playlist';
	 	template.button.title = 'Play next item from your Watch Next playlist';
	 	template.button.setAttribute('onclick', ';return false;');
	 	template.button.setAttribute('role', 'button');

	 	//glueing together
		template.button.appendChild(template.img);
	 	tempButton.appendChild(template.button);

	 	return tempButton;
	},

	addVideoIdToPlayNextButton: function() {
		var element = document.getElementsByClassName('watch-next-controls-play-next-video')[0];
		chrome.runtime.sendMessage({whatToDo: 'getNextVideoId', button: true}, function(response) {
			if (response.videoId) {
				newLook.makePlayNextButtonClickable(response.videoId, element);
			} else  {
				if (element) {
					newLook.deletePlayNextButton();
				}
			}			
		});
	},

	makePlayNextButtonClickable: function(id, element) {
		element.setAttribute('data-video-ids', id);
		element.addEventListener('click', newLook.playNextButtonOnClick);
	},

	playNextButtonOnClick: function(){
		var element = document.getElementsByClassName('watch-next-controls-play-next-video')[0],
			id = element.getAttribute('data-video-ids');
		newLook.playNextVideoFromPlaylist(id);
	},

	playNextVideoFromPlaylist: function(id) {
		//simulates the video ended event, so the extension loads next video
		chrome.runtime.sendMessage({whatToDo: 'videoWatched', videoId: 0}, function(){});
		document.location.href = 'https://www.youtube.com/watch?v='+id+'&feature=watchnext';
	},

	deletePlayNextButton: function() {
		var el = document.getElementsByClassName('watch-next-controls-play-next-video')[0];
		if (el) {
			el.parentNode.removeChild(el);	
		}
	},

	addVideoButtonOnClick: function(){
		var element = document.getElementById('watch-next-controls-add-this-video');
		newLook.addVideoToPlaylist(null, element);
	},

	resetAddToPlaylistButton: function(){
		var element = document.getElementById('watch-next-controls-add-this-video');
		if (element.classList.contains('watch-next-added-to-playlist')){
			newLook.videoTitle.parentNode.classList.add('watch-next-button-video-in-playlist');
		}
		newLook.renew(element, 22);
	},

	rebuildControls: function() {
		var element = document.getElementsByClassName('watch-next-controls-play-next-video')[0];
		if (element){
			element.removeEventListener('click', button.playNextButtonOnClick);
			newLook.addVideoIdToPlayNextButton();
		} else {
			var node = document.getElementsByClassName('watch-next-controls')[0];
			if (node) {
				node.appendChild(newLook.createPlayNextButton());
				newLook.addVideoIdToPlayNextButton();
			}
		}
	},

	changeAddToPlaylistButton: function() {
		var element = document.getElementById('watch-next-controls-add-this-video');
		element.setAttribute('data-video-ids', conFig.youtubeParser(window.location.href));
	},

	removeGreenBordersOnUrlChange: function() {
		var list = conFig.DOMtoArray(document.getElementsByClassName('watch-next-button-video-in-playlist')),
			i;
		for (i in list) {
			list[i].classList.remove('watch-next-button-video-in-playlist');
		}
	},

	refreshButtonsClasses: function() {
		var list = conFig.DOMtoArray(document.getElementsByClassName('watch-next-button-created')),
			i,
			element,
			oldUrl,
			newUrl;
		for (i in list) {
			element = list[i].parentNode.childNodes[list[i].parentNode.childNodes.length-1];
			if (element) {
				if (element.classList.contains('new-look-addto-watch-next-button')){
					// newUrl = list[i].parentNode.parentNode.getAttribute('href').slice(9,20);
					newUrl = list[i].getAttribute('href').slice(9,20);
					oldUrl = element.getAttribute('data-video-ids');
						if (newUrl === oldUrl) {

						} else {
							//console.log(false);
							element.setAttribute('data-video-ids', newUrl);
						}
				} else {
					list[i].classList.remove('watch-next-button-created');
				}
			}
		}
	},

	listenForUrlChange: function() {
		//console.log(window.location.href);
		//console.log(newLook.oldUrl);
		if (newLook.oldUrl.length > 0) {
			if (window.location.href === newLook.oldUrl) {
				// nothing
			} else {
				//console.log("zmiana!");
				newLook.rebuildControls();
				newLook.changeAddToPlaylistButton();
				newLook.removeGreenBordersOnUrlChange();
				newLook.oldUrl = window.location.href;
			}
		} else {
			newLook.oldUrl = window.location.href;
		}
	},

	init: function(){
		newLook.setLinksArray();
		newLook.linksArray.forEach(newLook.insertButton);
		newLook.setButtonArray();
		newLook.nextButtonsArray.forEach(newLook.makeButtonClickable);
		newLook.lookingForDescription();
		newLook.listenForUrlChange();
		newLook.refreshButtonsClasses();
		window.setTimeout(function(){newLook.init();}, 4000);
	},
};



//check if new look is enabled, then choose new / old look version to work with

var newOrOld = function () {
	if (document.getElementsByTagName("yt-icon").length) {
		newLook.init();
		//console.log('new look');
		chrome.storage.onChanged.addListener(newLook.rebuildControls);

	} else if (document.getElementsByClassName('thumb-link').length||document.getElementsByClassName('addto-watch-later-button').length){
		button.init();
		//console.log('old look');
		chrome.storage.onChanged.addListener(button.rebuildControls);
	} else {
		//console.log('not yet');
		window.setTimeout(function(){newOrOld();}, 1000);
	}
};

newOrOld();

}());