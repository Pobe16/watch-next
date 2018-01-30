http://goo.gl/3y2xFo

Watch Next lets you tell YouTube which video you want to watch after this one.
Ever saw a couple of YouTube videos and wanted to watch them just right after the one you are watching now? Make a Watch Next playlist - it plays automatically when you finish watching the current video.

You can add a video to Watch Next playlist from any thumbnail on YouTube, or from any link to YouTube (right-click menu).

Have fun making playlists!

Icons by Alexander Moore

Changes in version 1.10.0:
* ~EXPERIMENTAL~ rendering watch next button on YouTube's new layout, please send any bugs to pobe16@gmail.com. You can try the new look here: http://www.youtube.com/new 

Changes in version 1.9.2:
* fixed playlist not showing up when user added a video with hidden statistics, thanks Charles for the tip!

Changes in version 1.9.1:
* fixed the start / skip button not showing when the autoplay option is disabled 

Changes in version 1.9.0
- Added extra control buttons under the video player to add current video to playlist and to play next video from playlist immediately
- Recently added videos now have green border (experimental)

Changes in version 1.8.0
- You can now add duplicate videos to the playlist from the right-click menu
- You can now add duplicate videos to the playlist from thumbnail button - just move your mouse away from the thumbnail, and when you target it again, you can add it again
- If you click the button on thumbnail by mistake, you can click two more times to remove the video from playlist

Changes in version 1.7.1
* Fixed playlist not showing the recently readded (from history) item
* Fixed playlist sometimes not refreshing the icon when changing playlist size

Changes in version 1.7.0
- Playlist is now synchronised between computers using the same Google account.
* If you have more than one computer with different playlists on them, the playlists will be joined together.
* Fixed a typo

Changes in version 1.6.5
* Fixed the playlist not rendering correctly when there is a dead YouTube link in it. The dead or corrupted links will be deleted from your playlist automatically - thanks to Denis for heads up.
* Fixed the thumbnails sometimes displaying over the Autoplay button.

Changes in version 1.6.4
* fixed the button not showing on some thumbnails in youtube sidebar

Changes in version 1.6.3
* the playlist now correctly plays next video when switched from YouTube page without big player

Changes in version 1.6.2
* fixed the button placement on thumbnails for already watched movies

Changes in version 1.6.1
* minor text changes

Changes in version 1.6.0
- Playlist is now sortable - grab the video thumbnail and move it to new position!
- If you want to add the video to the playlist again, you can do so from the archive part - scroll to the top of playlist to see it, hover over the blue icon to get the video title, click the green icon to add the video again
- Added the button to clear whole playlist (and if it's emty - the whole archive)
* redo the backend to decrease the data queries to YouTube - the playlist loading time should improve

Changes in version 1.5.5
*Watch Next now correctly load next video from playlist with the end of movie, not the end of ad proceeding the movie

Changes in version 1.5.4
*Corrected the Watch Next button placement in related videos list

Changes in version 1.5.3
*Watch Next buttons now shows only when hovered over thumbnail

Changes in version 1.5.2:
*play now button in playlist window now correctly links to the right video instead of error page

Changes in version 1.5.1:
*fixed the playlist window for over 50 items in playlist
*changed the autoplay text in playlist window

Changes in version 1.5.0:
- Added total time of all videos in playlist,
* Set the height of playlist window

Changes in version 1.4.0:
- Watch Next button now shows on thumbnails loaded automatically when you scroll to the bottom of the page or with "Load more" button,
* fixed the context menu,
* fixed the icon not changing color when it's 0 items in playlist

Changes in version 1.3.2:

- Playlist items counter on the extension icon
* fixed bug not displaying hours in duration when there was more than 9 minutes
* fixed typo reenabling the popup window

Changes in version 1.2.1:

- Thumbnail icon now changes to blue to confirm adding video to playlist
- New icon for deleting videos from playlist
- Minified version - finally without jQuery
* A lot of code fixes

Changes in version 1.1.0:
- Watch Next icon is now displayed on every thumbnail on YouTube,
- Title display in playlist view now show only one line of text,
* Fixed time display in playlist view for videos over 10 minutes long,
* Code is a bit clearer and supposedly faster