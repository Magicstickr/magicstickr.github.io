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

	arWorldRoot = smoothedRoot;
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

	var all = new THREE.Group();

	// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	// var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
	// var cube = new THREE.Mesh( geometry, material );
	// all.add( cube );

	// the inside of the hole
	let geometry1	= new THREE.CylinderGeometry(1,1, 4, 32,1);
	let loader = new THREE.TextureLoader();
	let texture = loader.load( 'content/bricks.jpg' );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(4,2);
	let material1	= new THREE.MeshBasicMaterial({
		transparent : true,
		map: texture,
		side: THREE.BackSide
	}); 
	mesh1 = new THREE.Mesh( geometry1, material1 );
	mesh1.position.y = -2;
	all.add( mesh1 );
	
	// the invisibility cloak (ring; has circular hole)
	let geometry0 = new THREE.RingGeometry(1,9, 32);
	let material0 = new THREE.MeshBasicMaterial({
		// map: loader.load( 'images/color-grid.png' ), // for testing placement
		colorWrite: false
	});
	let mesh0 = new THREE.Mesh( geometry0, material0 );
	mesh0.rotation.x = -Math.PI/2;
	all.add(mesh0);

	// create the videoTexture
	var canPlayMp4	= document.createElement('video').canPlayType('video/mp4') !== '' ? true : false
	if( canPlayMp4 ){
		var url	= 'content/video.mp4';
	}else	alert('cant play mp4')

	var videoTexture= new THREEx.VideoTexture(url, "");
	video	= videoTexture.video;
	video.pause();

	onRenderFcts.push(function(delta, now){
		videoTexture.update(delta, now)
	})

	var geometry = new THREE.CircleGeometry( 1, 32 );
	var parameters = { color: 0xffffff, map: videoTexture.texture };
	var material = new THREE.MeshBasicMaterial( parameters );

	videoPlane = new THREE.Mesh( geometry, material );
	videoPlane.rotation.x = - Math.PI / 2
	videoPlane.position.y = -2;
	all.add( videoPlane );

	all.scale.multiplyScalar(0.5);
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

	var array = [videoPlane];

	var intersects = raycaster.intersectObjects( array );

	if ( intersects.length > 0) {
		if(video.paused == true){
			video.play();
		}else{
			video.pause();
		}
	}
}

function initSequence(){
	time = 0;
	video_time = 0;

	videoStart = false;
	stopAnim = false;

	startVideo = 3;

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

function initControl(){
	// controls

	controls = new THREE.OrbitControls( camera, renderer.domElement );

	//controls.addEventListener( 'change', render ); // call this only in static arWorldRoots (i.e., if there is no animation loop)

	controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.25;

	controls.screenSpacePanning = false;

	controls.minDistance = 0;
	controls.maxDistance = 500;

	controls.maxPolarAngle = Math.PI / 2;
}

function test(test_var){
	document.getElementById("test").innerHTML = "Test: " + test_var;
}