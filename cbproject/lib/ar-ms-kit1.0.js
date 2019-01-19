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
	renderer.setClearColor(new THREE.Color('lightgrey'), 0);
	renderer.setPixelRatio( window.devicePixelRatio );
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

	// Background plane
	var geometry = new THREE.PlaneGeometry( 3, 5 );
	var material = new THREE.MeshBasicMaterial( {color: 0xffffff, opacity: 0.5, transparent: true, side: THREE.DoubleSide} );
	plane = new THREE.Mesh( geometry, material );
	plane.position.set(1.5,3,0);
	all.add( plane );

	//Text1
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var color = 0x000000;
		var mat = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );
		var message = "Blue Dream, a sativa-dominant hybrid originating\nin California, has achieved legendary status among\nWest Coast strains.";
		var shapes = font.generateShapes( message, 0.06 );
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		text1 = new THREE.Mesh( geometry, mat );
		text1.position.set(0.1,7,0.1);
		all.add( text1 );
	}, undefined, function ( e ) {
		console.error( e );
	});

	//Text2
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var color = 0x000000;
		var mat = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );
		var message = "Blue Dream, a sativa-dominant hybrid originating\nin California, has achieved legendary status among\nWest Coast strains.";
		var shapes = font.generateShapes( message, 0.10 );
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		text1 = new THREE.Mesh( geometry, mat );
		text1.position.set(0.1,6,0.1);
		all.add( text1 );
	}, undefined, function ( e ) {
		console.error( e );
	});

	//Text3
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var color = 0x000000;
		var mat = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );
		var message = "Blue Dream, a sativa-dominant hybrid originating\nin California, has achieved legendary status among\nWest Coast strains.";
		var shapes = font.generateShapes( message, 0.14 );
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		text1 = new THREE.Mesh( geometry, mat );
		text1.position.set(0.1,5,0.1);
		all.add( text1 );
	}, undefined, function ( e ) {
		console.error( e );
	});

	//Text4
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var color = 0x000000;
		var mat = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );
		var message = "Blue Dream, a sativa-dominant hybrid originating\nin California, has achieved legendary status among\nWest Coast strains.";
		var shapes = font.generateShapes( message, 0.18 );
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		text1 = new THREE.Mesh( geometry, mat );
		text1.position.set(0.1,4,0.1);
		all.add( text1 );
	}, undefined, function ( e ) {
		console.error( e );
	});

	//Text5
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var color = 0x000000;
		var mat = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );
		var message = "Blue Dream, a sativa-dominant hybrid originating\nin California, has achieved legendary status among\nWest Coast strains.";
		var shapes = font.generateShapes( message, 0.22 );
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		text1 = new THREE.Mesh( geometry, mat );
		text1.position.set(0.1,2.6,0.1);
		all.add( text1 );
	}, undefined, function ( e ) {
		console.error( e );
	});

	//Text6
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var color = 0x000000;
		var mat = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );
		var message = "Blue Dream, a sativa-dominant hybrid originating\nin California, has achieved legendary status among\nWest Coast strains.";
		var shapes = font.generateShapes( message, 0.26 );
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		text1 = new THREE.Mesh( geometry, mat );
		text1.position.set(0.1,1.3,0.1);
		all.add( text1 );
	}, undefined, function ( e ) {
		console.error( e );
	});

	//Text7
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var color = 0x000000;
		var mat = new THREE.MeshBasicMaterial( {
			color: color,
			side: THREE.DoubleSide
		} );
		var message = "Blue Dream, a sativa-dominant hybrid originating\nin California, has achieved legendary status among\nWest Coast strains.";
		var shapes = font.generateShapes( message, 0.30 );
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		text1 = new THREE.Mesh( geometry, mat );
		text1.position.set(0.1,0,0.1);
		all.add( text1 );
	}, undefined, function ( e ) {
		console.error( e );
	});

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

		gltf.scene.scale.multiplyScalar(3);
		gltf.scene.position.set(-1.5,2,0);

		onRenderFcts.push(function(){
			gltf.scene.rotation.y += - 0.002*Math.PI;
			//console.log(gltf.scene.rotation.y);
		})
	
		marijuana = gltf.scene;
		//add it to the scene
		all.add( marijuana );

	}, undefined, function ( e ) {
		console.error( e );
	} );



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

	var array = [button, ordtext];

	var intersects = raycaster.intersectObjects( array );

	if ( intersects.length > 0) {
		window.location.href = 'https://www.leafly.ca/hybrid/blue-dream';
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