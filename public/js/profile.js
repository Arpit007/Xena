function createSentSnip(message) {
    var obj = "<li class='sent-msg'><p class='cyan lighten-2'><label>You</label><br/>" + message + "</p> </li>";
    obj = $.parseHTML(obj)[0];
    return obj;
}


function sendMessage(message) {
	var payload = {
        mType: 'TEXT',
        content: message,
        isGlobal: true, //change when neccessary
        otherUser: null,
        token: localStorage.token
    }
    socket.emit('send', payload);
    return createSentSnip(message); 
}

function receivedMessage(from, message) {
	var obj = "<li class='received-msg cyan darken-4'><label>" + from + "</label> <p>" + message + "</p> </li>"
	obj = $.parseHTML(obj)[0];
    return obj;
}

function addRecentChat(with_username) {
    var obj = "<a href = '#' class = 'collection-item' onClick = 'open_chat_modal(\"" + with_username + "\")'>" + with_username + "</a>";
    obj = $.parseHTML(obj)[0];
    console.log(obj);
    return obj;
}

function addPeer(name) {
    var obj = "<li class='collection-item' onClick = 'open_chat_modal(\"" + name + "\")'>" + name + "</li>";
    obj = $.parseHTML(obj);
    return obj;
}

function addGawd(name) {
    var obj = "<li class='collection-item' onClick = 'open_chat_modal(\"" + name + "\")'>" + name + "</li>";
    obj = $.parseHTML(obj);
    return obj;   
}

function open_chat_modal(startChatWith) {
    $('#chat-box').modal('open');
    $('#users-list').modal('close');
    $('#chat-with-name').text(startChatWith);
}

var logged_in_username;
var socket = null;

function connect(token) {
    socket = io.connect();
    socket.on('connect', function() {
        Materialize.toast('Connected to global chat', 3000, 'rounded');
        $("#previous-chats").append( addRecentChat("Global Chat") );
        socket.emit('verify', token);
        socket.on('UnAuhtorised', function() {
            localStorage.removeItem("username");
            localStorage.removeItem("token");
            localStorage.removeItem("email");
            document.write("Please wait...");
            window.location.assign("index.html");
        });
        socket.on('live', function(userList) {
            userList.admin.forEach( function(element) {
                $('#new-chat-gawds-member').html('');
                if(element.userName != logged_in_username) {
                    $('#new-chat-gawds-member').append( addGawd(element.userName) );
                }
            });
            userList.other.forEach( function(element) {
                $('#new-chat-learner').html('');
                if(element.userName != logged_in_username) {
                    $('#new-chat-learner').append( addPeer(element.userName) );
                }
            });
        });
        socket.on('onError', function(err) {
            console.dir(err);
        });
        socket.on('connectionSuccess', function() {
            socket.emit('liveList');
        });
        socket.on('onReceive', function(obj) {
            console.dir(obj);
            var obj = receivedMessage(obj.authorName, obj.content) ;
            $('#main-msg-box').append(obj);
            var val = $('#main-msg-box')[0].lastChild.offsetTop;
            $('.modal-content').animate({
                scrollTop: val 
            }, 50);
        });
    });
    return false;
}

$(document).ready(function() {
    if(typeof(Storage) === "undefined") {
        console.log("App cannot open!");
    } else { 
        if(!localStorage.username) {
            window.location.assign("index.html");
        } else {
           logged_in_username = localStorage.username; 
        }
    }
	$(".button-collapse").sideNav({
		menuWidth: 350
	});

	Materialize.toast('Logged in as ' + logged_in_username, 3000, 'rounded');

	if(window.innerWidth <= 992) {
		$('.tap-target').tapTarget('open');
	}

	$('.modal').modal({
						dismissible: true, // Modal can be dismissed by clicking outside of the modal
						opacity: .75, // Opacity of modal background
						inDuration: 300, // Transition in duration
						outDuration: 200, // Transition out duration
						startingTop: '4%', // Starting top style attribute
						endingTop: '5%', // Ending top style attribute
						ready: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
							$.post("/api/chat/global",
                            {
                                token: localStorage.token
                            },
                            function(data, status) {
                                data.reverse();
                                data.forEach(function(element) {
                                    console.dir(element);
                                    if(element.author.userName === logged_in_username) {
                                        $('#main-msg-box').append( createSentSnip(element.content) );
                                    } else {
                                        $('#main-msg-box').append( receivedMessage(element.author.userName, element.content) )
                                    }
                                    var val = $('#main-msg-box')[0].lastChild.offsetTop;
                                    $('.modal-content').animate({
                                        scrollTop: val 
                                    }, 50);
                                });
                            });
						},
						complete: function() { 
							$('#main-msg-box').html('');
						} // Callback for Modal close
    });

	$('#chat-bar-input').keydown(function(event){ 
        if(event.which === 13) {
        	if($('#chat-bar-input').val().length != 0 && $('#chat-bar-input').val().trim()) {
        		var obj = sendMessage( $('#chat-bar-input').val() ) ;
        		$('#main-msg-box').append(obj);
        		var val = $('#main-msg-box')[0].lastChild.offsetTop;
        		$('.modal-content').animate({
        			scrollTop: val 
      			}, 100);
      			$('#chat-bar-input').val('');
        	}
        }
    });

    $('#send-msg-btn').click(function() {
    	if($('#chat-bar-input').val().length != 0 && $('#chat-bar-input').val().trim()) {
    		var obj = sendMessage( $('#chat-bar-input').val() ) ;
    		$('#main-msg-box').append(obj);
    		var val = $('#main-msg-box')[0].lastChild.offsetTop;
    		$('.modal-content').animate({
    			scrollTop: val 
  			}, 50);
  			$('#chat-bar-input').val('');
    	}
    });

    

    $('#new-chat-btn').click(function() {
    	$('#users-list').modal('open');
    });

    $('#log-out-btn').click(function() {
        localStorage.removeItem("username");
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        document.write("Please wait...");
        window.location.assign("index.html");
    });

    var token = localStorage.token;
    connect(token);
});