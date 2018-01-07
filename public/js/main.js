$(document).ready(function() {
	if(typeof(Storage) === "undefined") {
		console.log("App cannot open!");
	} else {
		if(localStorage.username) {
			window.location.assign("profile.html");
		}
	}
	$('.progress').hide();
	$('#login-btn').click(function() {
		var username = $('#username').val();
		var pass = $('#password').val();
		if(username != "" && pass != "") {
			$('#enabler').addClass('disabled');
			$('.progress').show();
			$.post("/api/user/signin",
			{
				id: username,
				password: pass
			},
			function(data, status){
				console.dir(data.body);
				if(data.head.code === 200) {
					console.log('data set!');
					localStorage.username = data.body.userName;
					localStorage.token = data.body.token;
					localStorage.email = data.body.email;
					window.location.assign("profile.html")
				} else {
					$('#error-msg').text('Incorrect Username or Password!');
					$('.progress').hide();
					$('#enabler').removeClass('disabled');
				}
 			});
		} else {
			$('#error-msg').text('Cannot be left blank');
		}
	});

});