var ui = new firebaseui.auth.AuthUI(firebase.auth());

var loginOptions = {
	callbacks: {
		signInSuccessWithAuthResult: function(authResult, redirectUrl) {
			// User successfully signed in.
			// Return type determines whether we continue the redirect automatically
			// or whether we leave that to developer to handle.
			return false;
		},
		uiShown: function() {
			// The widget is rendered.
			// Hide the loader.
			document.getElementById('loader').style.display = 'none';
		}
	},
	// Will use popup for IDP Providers sign-in flow instead of the default, redirect.
	signInFlow: 'popup',
	signInOptions: [
		{ 
			provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
		}, 
		{
			provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID
		}//,
		// {
		// 	provider: firebase.auth.AppleAuthProvider.PROVIDER_ID
		// }
		
	],
	// Other config options...
}


function loginSuccess(user) {
	if (window.hasOwnProperty("watchNextUser")) {
		window.watchNextUser.uid = user.uid;
		window.watchNextUser.isLoggedIn = true;
	} else {
		window.watchNextUser = {}
		window.watchNextUser.uid = user.uid;
		window.watchNextUser.isLoggedIn = true;
	}

	document.querySelector("#user-not-logged-in").style.display = "none"
	document.querySelector("#user-is-logged-in").style.display = "block"

}


function signoutSuccess(){

	if (document.getElementById("firebaseui-auth-container").innerHTML.length < 1 ){
		ui.start('#firebaseui-auth-container', loginOptions);
	}
	
	if (window.hasOwnProperty("watchNextUser")) {
		window.watchNextUser.uid = "";
		window.watchNextUser.isLoggedIn = false;
	} else {
		window.watchNextUser = {}
		window.watchNextUser.uid = "";
		window.watchNextUser.isLoggedIn = false;
	}

	document.querySelector("#user-not-logged-in").style.display = "block"
	document.querySelector("#user-is-logged-in").style.display = "none"
}


firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		loginSuccess(user);
	} else {
		signoutSuccess()
	}
});

var button = document.getElementById("log-out-button");
button.addEventListener('click', function(){
	firebase.auth().signOut();
})