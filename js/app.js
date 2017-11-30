document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	doAbout();
	doBind();
	testKey(window.localStorage.getItem("key"));
}

function loginCheck(user, pass) {
	
	var url = 'http://' + user + ':' + pass + '@192.168.0.14:8889/init/api/login_test.txt'; 
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
}

function getKey() {
	var key = window.localStorage.getItem("key");
	if (key == null) {
		doQrScan();
	}
	testKey(key);
}

function testKey(key) {
	var url = 'http://192.168.0.11:8889/init/api/key_test.txt/' + key;
	$.get(
	  url,
	  function(data) {
		  if (data != "success") {
			  $('#loading_header').addClass("hidden");
			  $('#scan_barcode_header').removeClass("hidden");
			  alert("Error: Invalid Key! Please contact your dealer for a new barcode!");
			  window.localStorage.removeItem("key");
			} else {
			  $('#loading_header').removeClass("hidden");
			  $('#scan_barcode_header').addClass("hidden");
			  getStipulations();
			  $( "body" ).pagecontainer( "change", $("#homeScreen") , {reverse: false, changeHash: false});  //https://stackoverflow.com/questions/13252524/remove-page-from-jquery-mobile-history-such-that-back-button-bypasses-it
		  }
	  }
	).fail(function( jqXHR, textStatus, errorThrown) {
		alert( "Error 3: Failed to connect to CITTrack server!" );
	});
}

function doBind() {
	$( "#qr_scan" ).click(function() {
		getKey();
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
	alert('Error: ' + message);
}

function onCameraSuccess(imageData) {  // https://goo.gl/L1T18v
	var stipulation = window.sessionStorage.getItem("temp");
	var key = window.localStorage.getItem("key");
	var url = 'http://192.168.0.11:8889/init/api/post_image.txt/' + key + "/" + stipulation;
	var send = new FormData();
	send.append('image', imageData);
	$.ajax({
		url: url,
		data: send,
		cache: false,
		contentType: false,
		processData: false,
		type: 'POST',
		success: function(data){
			alert("Posted image ID " + data);
		},
		fail: function( jqXHR, textStatus, errorThrown) {
			alert( "Error 1: Failed to submit image to CITTrack!" );
		}
	});
}

function doQrScan(){
	cordova.plugins.barcodeScanner.scan(
		function (result) {
			window.localStorage.setItem("key", result.text);
			getKey();
			// alert("We got a barcode\n" +
				// "Result: " + result.text + "\n" +
				// "Format: " + result.format + "\n" +
				// "Cancelled: " + result.cancelled);
	  	},
	  	function (error) {
			alert("Scanning failed: " + error);
	  	},
		{
			'prompt' : "Scan the CITTrack Barcode now.",
		}
	);	
}

function refreshHome(){
	getStipulations();	
}

function getStipulations(){
	var url = 'http://192.168.0.11:8889/init/api/get_stipulations.json/' + window.localStorage.getItem("key");
	$.getJSON(  
	  url,
	  function(data) {
		doList(data);
	  }
	).fail(function( jqXHR, textStatus, errorThrown) {
		alert( "Error 2: Failed to connect to CITTrack server!" );
	});
}

function doList(data) {
	var tpl = _.template(
		"<% _.each( stipulations, function(v, k) { %>"+
			'<% var icon = _.sample(icons);  %>'+
			'<div data-role="collapsible">'+
				'<h3><i class="fa fa-<%-icon[1]%> fa-fw pull-right text-<%-icon[0]%>"></i><%- v["label"] %></h3>'+  //http://bit.ly/2xe8AmO
				  '<ul data-role="listview" data-inset="true" class="ui-nodisc-icon ui-alt-icon">'+
					'<li><a href="#about<%- k %>"><i class="fa fa-fw fa-question-circle"></i> What Is this?</a></li>'+
					'<li><a class="captureButton" data-stipulation="<%- k %>"><i class="fa fa-fw fa-camera"></i> Capture</a></li>'+
				  '</ul>'+
			'</div>'+
		'<% }); %>'
	);
	$("#target").html(tpl({stipulations: data, icons: icons})).enhanceWithin(); //getJSON otherwise JQM styling fails to apply https://goo.gl/NBUvT7
	$( ".captureButton" ).click(function() {
  		//doScan();
  		getCameraImage($(this).data("stipulation"));
	});
}	

function doAbout() {
	var tpl2 = _.template(
		"<% _.each( stipulations, function(v, k) { %>"+
			  '<div id="about<%- k %>" data-role="page">'+
				'<header data-role="header" data-position="fixed" data-id="appHeader">'+
				  '<h1><%- v["label"] %></h1>'+
				  '<a href="#homeScreen" class="ui-btn ui-icon-carat-l ui-btn-icon-notext ui-btn-left ui-nodisc-icon ui-alt-icon">Back</a>'+
				'</header>'+
				'<div data-role="content">'+
					'<%= v["description"]%>'+
				'</div>'+
			  '</div>'+
		'<% }); %>'
	);
	$("body").append(tpl2({stipulations: stipulations}));
}