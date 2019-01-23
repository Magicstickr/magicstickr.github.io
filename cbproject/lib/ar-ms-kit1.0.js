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

	// WoodenBox
	var geometry = new THREE.BoxGeometry( 1, 0.4, 1 );
	var loader = new THREE.TextureLoader().load('content/box.jpg', (imgLoader) => {});
	var material = new THREE.MeshPhongMaterial({
	    map: loader,
	});
	woodenBox = new THREE.Mesh( geometry, material );
	woodenBox.position.set(0,0.2,0);
	all.add( woodenBox );

	// // Test
	// var geometry = new THREE.PlaneGeometry( 1.6, 1.6 );
	// var material = new THREE.MeshLambertMaterial({ color: "#ff00ff"});
	// testplane = new THREE.Mesh( geometry, material );
	// testplane.rotation.x = - Math.PI/2;
	// testplane.position.set(0,0,0);
	// all.add( testplane );

	//strain title
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var xMid, yMid;
		var fontSize = 0.2;
		var mat = new THREE.MeshBasicMaterial( {color: 0x000000} );
		var message = "BLUE CHEESE";
		var shapes = font.generateShapes( message, fontSize);
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		// Center the text
		xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
		yMid = - 0.5 * ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );
		geometry.translate( xMid, yMid, 0 );
		title = new THREE.Mesh( geometry, mat );
		title.position.set(0,0,0.5+0.3+fontSize/2);
		title.rotation.x = - Math.PI/2;
		all.add( title );
	}, undefined, function ( e ) {
		console.error( e );
	});

	// California map
	var geometry = new THREE.PlaneGeometry( 1, 1 );
	var loader = new THREE.TextureLoader().load('content/california.png', (imgLoader) => {
		});
		//Load the image into a custom material
		var material = new THREE.MeshLambertMaterial({
		  side: THREE.DoubleSide,
		  transparent: true,
		  map: loader,
		});
	button = new THREE.Mesh( geometry, material );
	button.position.set(0.5+0.3+0.5,0,0);
	button.rotation.x = - Math.PI/2;
	button.rotation.z = Math.PI/2;
	all.add( button );

	var specGroup = new THREE.Group();
	var geometry = new THREE.CircleGeometry( 0.1, 32 );
	//Happy
	var loader = new THREE.TextureLoader().load('content/happy.jpg', (imgLoader) => {});
	var material = new THREE.MeshLambertMaterial({map: loader,});
	happy = new THREE.Mesh( geometry, material );
	happy.position.set(-0.5,0,0);
	specGroup.add( happy );
	//Relaxed
	var loader = new THREE.TextureLoader().load('content/relax.jpg', (imgLoader) => {});
	var material = new THREE.MeshLambertMaterial({map: loader,});
	relax = new THREE.Mesh( geometry, material );
	relax.position.set(-0.25,0,0);
	specGroup.add( relax );
	//Euphoric
	var loader = new THREE.TextureLoader().load('content/eupho.jpg', (imgLoader) => {});
	var material = new THREE.MeshLambertMaterial({map: loader,});
	eupho = new THREE.Mesh( geometry, material );
	eupho.position.set(0,0,0);
	specGroup.add( eupho );
	//Uplifted
	var loader = new THREE.TextureLoader().load('content/uplift.jpg', (imgLoader) => {});
	var material = new THREE.MeshLambertMaterial({map: loader,});
	uplift = new THREE.Mesh( geometry, material );
	uplift.position.set(0.5,0,0);
	specGroup.add( uplift );
	//Creative
	var loader = new THREE.TextureLoader().load('content/crea.jpg', (imgLoader) => {});
	var material = new THREE.MeshLambertMaterial({map: loader,});
	crea = new THREE.Mesh( geometry, material );
	crea.position.set(0.25,0,0);
	specGroup.add( crea );

	specGroup.rotation.x = - Math.PI/2;
	specGroup.rotation.z = - Math.PI/2;
	specGroup.position.set(-0.5-0.3-0.1,0,0);
	all.add( specGroup );

	//Spec bars
	var specBarGroup = new THREE.Group();
	var material = new THREE.MeshLambertMaterial({ color: "#648B43"});
	// Happy bar
	var barSize = 1;
	var geometry = new THREE.PlaneGeometry( 0.1, barSize );
	geometry.translate(0, -barSize/2, 0);
	happy_bar = new THREE.Mesh( geometry, material );
	happy_bar.position.set(-0.5,0,0);
	specBarGroup.add( happy_bar );
	// Relax bar
	var barSize = 0.8;
	var geometry = new THREE.PlaneGeometry( 0.1, barSize );
	geometry.translate(0, -barSize/2, 0);
	happy_relax = new THREE.Mesh( geometry, material );
	happy_relax.position.set(-0.25,0,0);
	specBarGroup.add( happy_relax );
	// Eupho bar
	var barSize = 0.6;
	var geometry = new THREE.PlaneGeometry( 0.1, barSize );
	geometry.translate(0, -barSize/2, 0);
	happy_eupho = new THREE.Mesh( geometry, material );
	happy_eupho.position.set(0,0,0);
	specBarGroup.add( happy_eupho );
	// Uplift bar
	var barSize = 0.3;
	var geometry = new THREE.PlaneGeometry( 0.1, barSize );
	geometry.translate(0, -barSize/2, 0);
	happy_uplift = new THREE.Mesh( geometry, material );
	happy_uplift.position.set(0.25,0,0);
	specBarGroup.add( happy_uplift );
	// Crea bar
	var barSize = 0.3;
	var geometry = new THREE.PlaneGeometry( 0.1, barSize );
	geometry.translate(0, -barSize/2, 0);
	happy_crea = new THREE.Mesh( geometry, material );
	happy_crea.position.set(0.5,0,0);
	specBarGroup.add( happy_crea );

	specBarGroup.rotation.x = - Math.PI/2;
	specBarGroup.rotation.z = - Math.PI/2;
	specBarGroup.position.set(-0.5-0.3-0.2-0.1,0,0);
	all.add( specBarGroup );

	//Order text
	var loader = new THREE.FontLoader();
	loader.load('lib/optimer_regular.typeface.json', function ( font ) {
		var xMid, yMid;
		var fontSize = 0.15;
		var mat = new THREE.MeshBasicMaterial( {color: 0x000000} );
		var message = "ORDER NOW";
		var shapes = font.generateShapes( message, fontSize);
		var geometry = new THREE.ShapeBufferGeometry( shapes );
		geometry.computeBoundingBox();
		// Center the text
		xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
		yMid = - 0.5 * ( geometry.boundingBox.max.y - geometry.boundingBox.min.y );
		geometry.translate( xMid, yMid, 0 );
		ordtext = new THREE.Mesh( geometry, mat );
		ordtext.position.set(0,0,-0.5-0.3-fontSize/2);
		ordtext.rotation.x = - Math.PI/2;
		ordtext.rotation.z = - Math.PI;
		all.add( ordtext );
	}, undefined, function ( e ) {
		console.error( e );
	});

	// Order button
	var geometry = new THREE.CircleGeometry( 0.3, 32 );
	var loader = new THREE.TextureLoader().load('content/button.jpg', (imgLoader) => {
		});
		//Load the image into a custom material
		var material = new THREE.MeshLambertMaterial({
		  side: THREE.DoubleSide,
		  map: loader,
		});
	button = new THREE.Mesh( geometry, material );
	button.position.set(0,0,-0.5-0.3-0.3-0.2);
	button.rotation.x = - Math.PI/2;
	button.rotation.z = - Math.PI;
	all.add( button );

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

		gltf.scene.scale.multiplyScalar(2);
		gltf.scene.position.set(0,1.5,0);

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