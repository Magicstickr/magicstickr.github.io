function loadOK(lang){
	switch(lang){
		case "fr":
			swal({
			  	title: 'C\'est pret! Pointe le QR code avec ta camera',
			  	type: 'success',
			  	confirmButtonText: 'OK',
			  	footer: 'STP, autorise l\'acces a ta camera!',
			  	showLoaderOnConfirm: true,
					preConfirm: () => {
						// video.play();
						// video.pause();
						// initSequence();
				}
			});
			break;
		case "eng":
			swal({
			  	title: 'Ready, point the QR code with your camera',
			  	type: 'success',
			  	confirmButtonText: 'OK',
			  	footer: 'Please, enable the camera access',
			  	showLoaderOnConfirm: true,
					preConfirm: () => {
						// video.play();
						// video.pause();
						// initSequence();
				}
			});
		break;
	}
}

function initScene(){
	//////////////////////////////////////////////////////////////////////////////////
	//		Init
	//////////////////////////////////////////////////////////////////////////////////

	//Error if not WebGL compatible
	if ( WEBGL.isWebGLAvailable() === false ) {
			document.body.appendChild( WEBGL.getWebGLErrorMessage() );
	}

	switch(lang){
		case "fr":
			swal({
			  	title: 'Scan OK, patiente un petit peu!',
			  	type: 'info',
			  	footer: 'STP, autorise l\'acces a ta camera!',
			  	showConfirmButton: false,
	  			timer: 1500000
			});
			break;
		case "eng":
			swal({
			  	title: 'Scan OK, please wait',
			  	type: 'info',
			  	footer: 'Please, enable the camera access',
			  	showConfirmButton: false,
	  			timer: 1500000
			});
		break;
	}

	//init screen mode
	
	isSeqInit = false;

	//console.log(screen_mode);

	// init renderer
	renderer	= new THREE.WebGLRenderer({
		antialias	: true,
		autoResize : true,
		alpha: true
	});
	renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
	document.body.appendChild( renderer.domElement );

	// array of functions for the rendering loop
	onRenderFcts= [];

	// init arWorldRoot and camera

	scene = new THREE.Scene();
}

function initCameraLight(){
	//////////////////////////////////////////////////////////////////////////////////
	//		Initialize a basic camera
	//////////////////////////////////////////////////////////////////////////////////

	// Create a camera
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1500 );
	scene.add(camera);

	var light = new THREE.AmbientLight( 0xffffff ); // soft white light
	scene.add( light );
}

function initAREngine(markerPatt){
	////////////////////////////////////////////////////////////////////////////////
	//          handle arToolkitSource
	////////////////////////////////////////////////////////////////////////////////

	arToolkitSource = new THREEx.ArToolkitSource({
		// to read from the webcam 
		sourceType : 'webcam'	
	})
	

	arToolkitSource.init(function onReady(){
		onResize()
	})
	
	// handle resize
	window.addEventListener('resize', function(){
		onResize()
	})
	function onResize(){
		arToolkitSource.onResizeElement()	
		arToolkitSource.copyElementSizeTo(renderer.domElement)	
		if( arToolkitContext.arController !== null ){
			arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
		}	
	}
	////////////////////////////////////////////////////////////////////////////////
	//          initialize arToolkitContext
	////////////////////////////////////////////////////////////////////////////////
	

	// create atToolkitContext
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
		detectionMode: 'mono',
		maxDetectionRate: 30,
		canvasWidth: 80*3,
		canvasHeight: 60*3,
	})
	// initialize it
	arToolkitContext.init(function onCompleted(){
		// copy projection matrix to camera
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	})

	// update artoolkit on every frame
	onRenderFcts.push(function(){
		if( arToolkitSource.ready === false )	return
		arToolkitContext.update( arToolkitSource.domElement )
	})
	
	////////////////////////////////////////////////////////////////////////////////
	//          Create a ArMarkerControls
	////////////////////////////////////////////////////////////////////////////////
	
	markerRoot = new THREE.Group
	scene.add(markerRoot)
	artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
		//type: 'barcode',
		//barcodeValue: 'https://magicstickr.github.io/video-base/index.html',
		type : 'pattern',
		patternUrl : markerPatt
	})

	// build a smoothedControls
	smoothedRoot = new THREE.Group()
	scene.add(smoothedRoot)
	smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
		lerpPosition: 0.4,
		lerpQuaternion: 0.3,
		lerpScale: 1,
	})
	onRenderFcts.push(function(delta){
		smoothedControls.update(markerRoot);
	})
}

function onDocumentTouchStart( event ) {

		event.preventDefault();

		event.clientX = event.touches[0].clientX;
		event.clientY = event.touches[0].clientY;
		onDocumentMouseDown( event );
}

function renderEngine(){
	//////////////////////////////////////////////////////////////////////////////////
	//		render the whole thing on the page
	//////////////////////////////////////////////////////////////////////////////////

	// render the scene
	onRenderFcts.push(function(){
		renderer.render( scene, camera );
	})

	// run the rendering loop
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
	})

	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'touchstart', onDocumentTouchStart, false );
}

function addObjects(){
	//////////////////////////////////////////////////////////////////////////////////
	//		Add the objects in the scene
	//////////////////////////////////////////////////////////////////////////////////

	arWorldRoot = smoothedRoot;

	var all = new THREE.Group();

	// QR code plane
	var geometry = new THREE.PlaneGeometry( 1.5, 1.5 );
	var loader = new THREE.TextureLoader().load('content/logo.png', (imgLoader) => {
		});
		//Load the image into a custom material
		var material = new THREE.MeshLambertMaterial({
		  map: loader,
		  transparent: true,
		});
	qrPlane = new THREE.Mesh( geometry, material );
	qrPlane.rotation.x = -Math.PI/2;
	all.add( qrPlane );

	// Incredible Bulk Auto plane
	var geometry = new THREE.PlaneGeometry( 0.8, 0.7 );
	var material = new THREE.MeshBasicMaterial( {color: 0x00ffff, opacity: 0.0, transparent: true} );
	icbPlane = new THREE.Mesh( geometry, material );
	icbPlane.rotation.x = -Math.PI/2;
	icbPlane.position.set(1,0,1.3);
	all.add( icbPlane );

	// GTA plane
	gtaPlane = new THREE.Mesh( geometry, material );
	gtaPlane.rotation.x = -Math.PI/2;
	gtaPlane.position.set(1,0,2.7);
	all.add( gtaPlane );

	// Load marijuana
	var loader = new THREE.GLTFLoader().load('content/cb/scene.gltf', function ( gltf ) {
		//Resize/rescale the 3D Object
		var bbox = new THREE.Box3().setFromObject(gltf.scene);
		var cent = bbox.getCenter(new THREE.Vector3());
		var size = bbox.getSize(new THREE.Vector3());
		//Rescale the object to normalized space
		var maxAxis = Math.max(size.x, size.y, size.z);
		gltf.scene.scale.multiplyScalar(1.0 / maxAxis);
		bbox.setFromObject(gltf.scene);
		bbox.getCenter(cent);
		bbox.getSize(size);
		gltf.scene.position.copy(cent).multiplyScalar(1);

		gltf.scene.scale.multiplyScalar(4);
		gltf.scene.position.set(1,0,1.3);
		gltf.scene.visible = false;
	
		marijuana1 = gltf.scene;
		//add it to the scene
		all.add( marijuana1 );

	}, undefined, function ( e ) {
		console.error( e );
	} );

	// Load marijuana
	var loader = new THREE.GLTFLoader().load('content/cb/scene.gltf', function ( gltf ) {
		//Resize/rescale the 3D Object
		var bbox = new THREE.Box3().setFromObject(gltf.scene);
		var cent = bbox.getCenter(new THREE.Vector3());
		var size = bbox.getSize(new THREE.Vector3());
		//Rescale the object to normalized space
		var maxAxis = Math.max(size.x, size.y, size.z);
		gltf.scene.scale.multiplyScalar(1.0 / maxAxis);
		bbox.setFromObject(gltf.scene);
		bbox.getCenter(cent);
		bbox.getSize(size);
		gltf.scene.position.copy(cent).multiplyScalar(1);

		gltf.scene.scale.multiplyScalar(4);
		gltf.scene.position.set(1,0,2.7);
		gltf.scene.visible = false;
	
		marijuana2 = gltf.scene;
		//add it to the scene
		all.add( marijuana2 );

	}, undefined, function ( e ) {
		console.error( e );
	} );

	all.scale.multiplyScalar(1);
	//all.position.z = 0.5;
	arWorldRoot.add(all);
}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var icbArray = [icbPlane];
	var gtaArray = [gtaPlane];

	var icbIntersects = raycaster.intersectObjects( icbArray );
	var gtaIntersects = raycaster.intersectObjects( gtaArray );

	if ( icbIntersects.length > 0) {
		if(marijuana1.visible == false){
			marijuana1.visible = true;
		}else{
			marijuana1.visible = false;
		}
	}
	if ( gtaIntersects.length > 0) {
		if(marijuana2.visible == false){
			marijuana2.visible = true;
		}else{
			marijuana2.visible = false;
		}
	}
}

function initSequence(){
	time = 0;
	video_time = 0;

	videoStart = false;
	stopAnim = false;

	startVideo = 3;
	startPic1 = 9;
	startPic2 = 29;
	startPic3 = 47;

	onRenderFcts.push(function(){
		
		//Init chrono
		time += 0.02;
		video_time = video.currentTime;
		document.getElementById("time").innerHTML = "Time: " + Math.round(time) + " Video time: " + Math.round(video_time);

		//Launch speech
		var start = startVideo;
		if(videoStart == false && Math.round(time) == start ){
			//videoPlane.visible = true;
			video.play();
			videoStart = true;
		}

		//Show Pic1
		var start = startPic1 - 3; 
		var end = startPic1; 
		var t = (video_time-start)/(end-start);
		if(	video_time >= start && video_time < end ){
			t_down = (10*t-10); //t_down goes from -10 to 0
			t_lowered = t_down/3;
			pic1.position.y = -t_lowered*t_lowered*t_lowered + 3; // cubic function
			pic1.visible = true;
		}

		//Hide Pic1
		var start = startPic1 + 3; 
		var end = startPic1 + 6; 
		var t = (video_time-start)/(end-start);
		if(	video_time >= start && video_time < end ){
			t_up = (10*t); // t_up goes from 0 to 10
			t_lowered = t_up/3;
			pic1.position.y = -t_lowered*t_lowered*t_lowered + 3; // cubic function
			if (video_time >= end-0.1){
				pic1.visible = false;
			}
		}

		//Show Pic2 
		var start = startPic2 - 3; 
		var end = startPic2; 
		var t = (video_time-start)/(end-start);
		if(	video_time >= start && video_time < end ){
			t_down = (10*t-10); //t_down goes from -10 to 0
			t_lowered = t_down/3;
			pic2.position.y = -t_lowered*t_lowered*t_lowered + 3; // cubic function
			pic2.visible = true;
		}

		//Hide Pic2 
		var start = startPic2 + 3; 
		var end = startPic2 + 6; 
		var t = (video_time-start)/(end-start);
		if(	video_time >= start && video_time < end ){
			t_up = (10*t); // t_up goes from 0 to 10
			t_lowered = t_up/3;
			pic2.position.y = -t_lowered*t_lowered*t_lowered + 3; // cubic function
			if (video_time >= end-0.1){
				pic2.visible = false;
			}
		}

		//Show Pic3 
		var start = startPic3 - 3; 
		var end = startPic3;  
		var t = (video_time-start)/(end-start);
		if(	video_time >= start && video_time < end ){
			t_down = (10*t-10); //t_down goes from -10 to 0
			t_lowered = t_down/3;
			pic3.position.y = -t_lowered*t_lowered*t_lowered + 3; // cubic function
			pic3.visible = true;
		}

		//Hide Pic3 
		var start = startPic3 + 3; 
		var end = startPic3 + 6;  
		var t = (video_time-start)/(end-start);
		if(	video_time >= start && video_time < end ){
			t_up = (10*t); // t_up goes from 0 to 10
			t_lowered = t_up/3;
			pic3.position.y = -t_lowered*t_lowered*t_lowered + 3; // cubic function
			if (video_time >= end-0.1){
				pic3.visible = false;
			}
		}

		// Stop speech
		var start = video.duration;
		if(Math.round(video_time) == start && stopAnim == false){
			videoPlane.visible = false;
			speechStopped = true;
			isVideoPlay == false;
			video.pause();
			time = 100;
			stopAnim = true;
		}

	})
}

function test(test_var){
	document.getElementById("test").innerHTML = "Test: " + test_var;
}