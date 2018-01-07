$(document).ready(function() {
	if(typeof(Storage) === "undefined") {
		console.log("App cannot open!");
	} else {
		if(localStorage.username) {
			window.location.assign("profile.html");
		}
	}
	$('.progress').hide();
	$('#signup-btn').click(function() {
		var user = $('#username').val();
		var pass = $('#password').val();
		var mail = $('#email').val();
		var repass = $('#re-password').val();
		if(pass != repass) {
			$('#error-msg').text('Passwords do not match');	
		} else if(user != "" && pass != "" && mail != "" && repass != "") {
			$('#enabler').addClass('disabled');
			$('.progress').show();
			$.post("/api/user/signup",
			{
				userName: user,
				password: pass,
				email: mail
			},
			function(data, status){
				console.dir(data);
				if(data.head.code === 700) {
					$('.progress').hide();
					$('#enabler').removeClass('disabled');
					$('#error-msg').text('Password too short < 8');		
				} else if(data.head.code === 701) {
					$('.progress').hide();
					$('#enabler').removeClass('disabled');
					$('#error-msg').text('Password too long > 32');
				} else if(data.head.code === 405) {
					$('.progress').hide();
					$('#enabler').removeClass('disabled');
					$('#error-msg').text('Username or email already exists');
				} else if(data.head.code === 200) {
					localStorage.username = data.body.userName;
					localStorage.token = data.body.token;
					localStorage.email = data.body.email;
					window.location.assign("profile.html")
				} else {
					$('.progress').hide();
					$('#enabler').removeClass('disabled');
					$('#error-msg').text('Unknown error occured');
				}
 			});
		} else {
			$('#error-msg').text('Cannot be left blank');
		}
	});

});