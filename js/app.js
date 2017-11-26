document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	doList();
	doAbout();
	doBind();
	loginCheck("himel@insightmanagement.org","faggot");
}

function loginCheck(user, pass) {
	var url = 'http://' + user + ':' + pass + '@192.168.0.14:8889/init/api/login_test.txt'; 
	$.ajax({
	  url,
	  function(data) {
		  if (data != "success") {
			  $("#dlg-invalid-credentials").popup("open");
			} else {
			  alert("success!");
			}
	  }
	});
}

function doBind() {
	$( ".captureButton" ).click(function() {
  		//doScan();
  		getCameraImage();
	});
}

function getCameraImage() {
	navigator.camera.getPicture(onCameraSuccess, onCameraError, 
		{
			quality: 100, 
			allowEdit: false, 
			destinationType: navigator.camera.DestinationType.DATA_URL,
			encodingType: navigator.camera.EncodingType.PNG
		}
	);
}

function onCameraError(message) {
	alert('Error: ' + message);
}

function onCameraSuccess(imageData) {
	alert(imageData);
}

function doScan(){
	cordova.plugins.barcodeScanner.scan(
		function (result) {
			alert("We got a barcode\n" +
				"Result: " + result.text + "\n" +
				"Format: " + result.format + "\n" +
				"Cancelled: " + result.cancelled);
	  	}, 
	  	function (error) {
			alert("Scanning failed: " + error);
	  	}
	);	
}

function refreshPage(){
	getStipulations();	
}

//function getStipulations(){
	
//}

function doList() {
	var tpl = _.template(
		"<% _.each( stipulations, function(v, k) { %>"+
			'<% var icon = _.sample(icons);  %>'+
			'<div data-role="collapsible">'+
				'<h3><i class="fa fa-<%-icon[1]%> fa-fw pull-right text-<%-icon[0]%>"></i><%- v["label"] %></h3>'+  //http://bit.ly/2xe8AmO
				  '<ul data-role="listview" data-inset="true" class="ui-nodisc-icon ui-alt-icon">'+
					'<li><a href="#about<%- k %>"><i class="fa fa-fw fa-question-circle"></i> What Is this?</a></li>'+
					'<li><a class="captureButton"><i class="fa fa-fw fa-camera"></i> Capture</a></li>'+
				  '</ul>'+
			'</div>'+
		'<% }); %>'
	);
	$("#target").append(tpl({stipulations: stipulations, icons: icons}));
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