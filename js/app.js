var login = 0;

var url_base = "http://192.168.0.34:9003"

document.addEventListener("deviceready", onDeviceReady, false);

$(document).on('pagebeforeshow', '#sign_in', function() {
    if(login === 1) {//login condition https://stackoverflow.com/questions/22450146/hide-and-remove-jquery-mobile-login-page-after-login
        $.mobile.changePage("#homeScreen");
    }
});

function onDeviceReady() {
	$('.main-header').load('header.html');
	$('.main-footer').load('footer.html');
	doBind();
	doAbout();
	getKey();
}

/* function loginCheck(user, pass) {
	
	var url = 'http://' + user + ':' + pass + '@192.168.0.14:8889/cittrack/api/login_test.txt'; 
	$.get(
	  url,
	  function(data) {
		  if (data != "success") {
			  $("#dlg-invalid-credentials").popup("open");
			} else {
			  alert("success!");
		  }
	  }
	);
} */

function getKey() {
	var key = window.localStorage.getItem("key");
	if (!key) {
		doQrScan();
	} else {
		testKey(key);
	}	
}

function testKey(key) {
	var url = url_base + '/cittrack/api/key_test.txt/' + key;
	$.get(
	  url,
	  function(data) {
		  if (data != "success") {
			  $('#loading_header').hide();
			  $('#scan_barcode_header').show();
			  toast("Error 1: Invalid Key! Please contact your dealer for a new barcode!");
			  window.localStorage.removeItem("key");
			} else {
			  $('#loading_header').show();
			  $('#scan_barcode_header').hide();
			  getStipulations();
			  login = 1;
			  $( "body" ).pagecontainer( "change", $("#homeScreen") , {reverse: false, changeHash: false});  //https://stackoverflow.com/questions/13252524/remove-page-from-jquery-mobile-history-such-that-back-button-bypasses-it
		  }
	  }
	).fail(function( jqXHR, textStatus, errorThrown) {
		toast( "Error 2: Failed to connect to CITTrack server!" );
	});
}

function doBind() {
	//USE DOCUMENT ON CLICK FROM NOW ON, .CLICK CAUSES UNEXPECTED BEHAVIOR
	//DEVICE READY DOES NOT MEAN DOCUMENT IS READY
	$(document).on("tap", "#qr_scan", function() {
		doQrScan();
	});	
	$(document).on( "tap", "#get_messages", function() {  
		getMessages();
	});
	$(document).on( "tap", "#get_info", function() {
		getInformation();
	});		
	$(document).on( "tap", "#get_stipulations", function() {
		getStipulations();  //fires multiple times upon inspect https://stackoverflow.com/questions/14969960/jquery-click-events-firing-multiple-times
	});
	$(document).on( "submit", "#submit_message", function(evt) {
		sendMessage(evt);
		
		return false;
	});
}

function sendMessage(evt) {
	
	evt.preventDefault();
	
	var key = window.localStorage.getItem("key");
	
	var url = url_base + '/cittrack/api/post_message.txt/' + key;
	
	var send = new FormData();
	send.append('message', $("#submit_message_input").val());
	
	$.ajax({
		url: url,
		data: send,
		cache: false,
		contentType: false,
		processData: false,
		type: 'POST',
		success: function(data){
			toast("Message sent!");
			getMessages();
		},
		fail: function( jqXHR, textStatus, errorThrown) {
			toast( "Error 9: Failed to submit message to CITTrack!" );
		}
	});
	
}

function getCameraImage(stipulation) {
	window.sessionStorage.setItem("temp", stipulation);
	navigator.camera.getPicture(onCameraSuccess, onCameraError, 
		{
			quality: 75, 
			allowEdit: false, 
			destinationType: navigator.camera.DestinationType.DATA_URL,
			encodingType: navigator.camera.EncodingType.JPEG // or PNG
		}
	);
}

function onCameraError(message) {
	toast('Error 3: ' + message);
}

function onCameraSuccess(imageData) {  // https://goo.gl/L1T18v
	var stipulation = window.sessionStorage.getItem("temp");
	var key = window.localStorage.getItem("key");
	var url = url_base + '/cittrack/api/post_image.txt/' + key + "/" + stipulation;
	var send = new FormData();
	send.append('image', imageData);
	
	toast("Uploading image...");
	
	$.ajax({
		url: url,
		data: send,
		cache: false,
		contentType: false,
		processData: false,
		type: 'POST',
		success: function(data){
			toast("Image upload success! Your dealer will review it shortly.");
			getStipulations();
		},
		fail: function( jqXHR, textStatus, errorThrown) {
			toast( "Error 4: Failed to submit image to CITTrack!" );
		}
	});
}

function doQrScan(){
	cordova.plugins.barcodeScanner.scan(
		function (result) {
			window.localStorage.setItem("key", result.text);
			testKey(result.text);
			// alert("We got a barcode\n" +
				// "Result: " + result.text + "\n" +
				// "Format: " + result.format + "\n" +
				// "Cancelled: " + result.cancelled);
	  	},
	  	function (error) {
			toast("Error 5: " + error);
	  	},
		{
			'prompt' : "Scan the CITTrack Barcode now.",
		}
	);	
}

function getMessages(){
	var url = url_base + '/cittrack/api/messages.json/' + window.localStorage.getItem("key");
	$.getJSON(  
	  url,
	  function(data) {
		doMessages(data);
	  }
	).fail(function( jqXHR, textStatus, errorThrown) {
		toast( "Error 6: Failed to connect to CITTrack server!" );
	});
}

function getStipulations(){
	var url = url_base + '/cittrack/api/get_stipulations.json/' + window.localStorage.getItem("key");
	$.getJSON(  
	  url,
	  function(data) {
		doList(data);
	  }
	).fail(function( jqXHR, textStatus, errorThrown) {
		toast( "Error 7: Failed to connect to CITTrack server!" );
	});
}


function getInformation(){
	var url = url_base + '/cittrack/api/get_information.json/' + window.localStorage.getItem("key");
	$.getJSON(  
	  url,
	  function(data) {
		doInfo(data);
	  }
	).fail(function( jqXHR, textStatus, errorThrown) {
		toast( "Error 8: Failed to connect to CITTrack server!" );
	});
}


function doList(data) {
	var tpl = _.template(
		"<% _.each( stipulations, function(v, k) { %>"+
			'<div data-role="collapsible">'+
				'<h3><i class="<%-v["icon"]%> pull-right <%-v["color"]%>"></i><%- v["label"] %></h3>'+  //http://bit.ly/2xe8AmO
				  '<ul data-role="listview" data-inset="true" class="ui-nodisc-icon ui-alt-icon">'+
					'<li><a href="#about<%- k %>"><i class="fa fa-fw fa-question-circle"></i> What Is this?</a></li>'+
					'<li><a class="captureButton" data-stipulation="<%- k %>"><i class="fa fa-fw fa-camera"></i> Capture</a></li>'+
				  '</ul>'+
			'</div>'+
		'<% }); %>'
	);
	$("#stipulations").html(tpl({stipulations: data, icons: icons})).enhanceWithin(); //getJSON otherwise JQM styling fails to apply https://goo.gl/NBUvT7
	$(document).one( "tap", ".captureButton", function() {  
  		getCameraImage($(this).data("stipulation"));
	});
}	

function doAbout() {
	var tpl = _.template(
		"<% _.each( stipulations, function(v, k) { %>"+
			  '<div id="about<%- k %>" data-role="page">'+
				'<header data-role="header" data-position="fixed">'+
				  '<h1><%- v["label"] %></h1>'+
				'</header>'+
				'<div data-role="content">'+
					'<%= v["description"]%>'+
				'</div>'+
			  '</div>'+
		'<% }); %>'
	);
	$("body").append(tpl({stipulations: stipulations}));
}

function doMessages(data) {
	var tpl = _.template(
		"<% _.each( data, function(v, k) { %>"+
			'<ul data-role="listview" data-inset="true" class="ui-listview ui-listview-inset ui-corner-all ui-shadow">'+
				'<li data-role="list-divider" role="heading" class="ui-li-divider ui-bar-inherit ui-li-has-count ui-first-child"><%- v["person"] %> on <%- v["date"] %>'+
				'</li>'+
				'<li>'+
					'<div style="white-space: normal;"><%- v["message"] %></div>'+ //white-space: normal; to stop truncate
				'</li>'+
			'</ul>'+
		'<% }); %>'
	);
	$("#messages").html(tpl({data: data})).enhanceWithin(); //getJSON otherwise JQM styling fails to apply 
}

function doInfo(data) {
	var tpl = _.template(
		'<h3>Contract ID: </h3><p><%= info["contract_id"]%></p>'+
		'<h3>Vehicle: </h3><p><%= info["vehicle"]%></p>'+
		'<h3>Dealership: </h3><p><%= info["dealership"]%></p>'+
		'<h3>Dealership address: </h3><p><%= info["dealership_add"]%></p>'+
		'<h3>Dealership Tel: </h3><p><%= info["dealership_tel"]%></p>'+
		'<h3>Dealer: </h3><p><%= info["dealer"]%></p>'+
		'<h3>Dealer Tel: </h3><p><%= info["dealer_tel"]%></p>'
	);
	$("#information").html(tpl({info: data})).enhanceWithin();
}