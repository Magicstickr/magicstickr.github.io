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
						video.play();
						video.pause();
						initSequence();
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
						video.play();
						video.pause();
						initSequence();
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

		if (isSeqInit == false){
			if(arToolkitContext.arController != null){
				if(arToolkitContext.arController.patternMarkers[0] != null){
					if(arToolkitContext.arController.patternMarkers[0].inCurrent == true){
						console.log("seq init");
						initSequence();
						isSeqInit = true;
					}
				}
			}
		}

		if(arToolkitContext.arController != null){
			if(arToolkitContext.arController.patternMarkers[0] != null){
				if(arToolkitContext.arController.patternMarkers[0].inCurrent == false){
					video.pause();
				}
				else if(arToolkitContext.arController.patternMarkers[0].inCurrent == true && video.paused == true && isVideoPlay == true){
					video.play();
				}
			}
		}
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

	isVideoPlay = false;
	
	var xsize = 1;
	var ysize = xsize * 0.5625;

	var geometry = new THREE.PlaneGeometry(xsize, ysize);

	var loc = window.location.href;
	var directoryPath = loc.substring(0, loc.lastIndexOf("/")+1);
	var movieMaterial = new ChromaKeyMaterial(directoryPath + 'content/yann.mp4', 1280, 720, "#5BA551");
	// green: 0xd432
	// white: 0xffff

	videoPlane = new THREE.Mesh( geometry, movieMaterial );
	videoPlane.position.y = 1.3;
	videoPlane.position.z = 2;
	videoPlane.scale.multiplyScalar(5);
	//videoPlane.visible = false;
	video.loop = false;

	all.add( videoPlane );	

	onRenderFcts.push(function(delta, now){
		movieMaterial.update();
	})

	//add snow
	var tile_size = 2;
	var geometry = new THREE.PlaneGeometry(13, 5);

    var texture = new THREE.TextureLoader().load( "content/floor.png" );
    var material = new THREE.MeshLambertMaterial({
	  map: texture,
	  transparent: true,
	});
	var snow = new THREE.Mesh(geometry, material);
    snow.rotation.x = -Math.PI/2;
    snow.position.z = 1;

	snow.visible = true;
	
	all.add( snow );

	// Load Gifts
	var loader = new THREE.GLTFLoader().load('content/gift/scene.gltf', function ( gltf ) {
		//Resize/rescale the 3D Object
		var bbox = new THREE.Box3().setFromObject(gltf.scene);
		var cent = bbox.getCenter(new THREE.Vector3());
		var size = bbox.getSize(new THREE.Vector3());
		//Rescale the object to normalized space
		var maxAxis = Math.max(size.x, size.y, size.z);
		gltf.scene.scale.multiplyScalar(2.0 / maxAxis);
		bbox.setFromObject(gltf.scene);
		bbox.getCenter(cent);
		bbox.getSize(size);
		//Reposition to 0,halfY,0
		gltf.scene.position.copy(cent).multiplyScalar(-1);
		gltf.scene.position.y = 0;
		gltf.scene.position.x += 3;
		gltf.scene.position.z = 0;
		gltf.scene.visible = true;
	
		gift = gltf.scene;
		gift.position.z += 0.5;
		//add it to the scene
		all.add( gift );

	}, undefined, function ( e ) {
		console.error( e );
	} );

	// Load Tree
	var loader = new THREE.GLTFLoader().load('content/tree/scene.gltf', function ( gltf ) {
		//Resize/rescale the 3D Object
		var bbox = new THREE.Box3().setFromObject(gltf.scene);
		var cent = bbox.getCenter(new THREE.Vector3());
		var size = bbox.getSize(new THREE.Vector3());
		//Rescale the object to normalized space
		var maxAxis = Math.max(size.x, size.y, size.z);
		gltf.scene.scale.multiplyScalar(5.0 / maxAxis);
		bbox.setFromObject(gltf.scene);
		bbox.getCenter(cent);
		bbox.getSize(size);
		//Reposition to 0,halfY,0
		gltf.scene.position.copy(cent).multiplyScalar(-1);
		gltf.scene.position.y = 0;
		gltf.scene.position.x += 1;
		gltf.scene.position.z -= 1;
		gltf.scene.visible = true;
	
		tree = gltf.scene;
		tree.position.y += 0.7;
		//add it to the scene
		all.add( tree );

	}, undefined, function ( e ) {
		console.error( e );
	} );

	// // Load House
	// var loader = new THREE.GLTFLoader().load('content/house/scene.gltf', function ( gltf ) {
	// 	//Resize/rescale the 3D Object
	// 	var bbox = new THREE.Box3().setFromObject(gltf.scene);
	// 	var cent = bbox.getCenter(new THREE.Vector3());
	// 	var size = bbox.getSize(new THREE.Vector3());
	// 	//Rescale the object to normalized space
	// 	var maxAxis = Math.max(size.x, size.y, size.z);
	// 	gltf.scene.scale.multiplyScalar(3.0 / maxAxis);
	// 	bbox.setFromObject(gltf.scene);
	// 	bbox.getCenter(cent);
	// 	bbox.getSize(size);
	// 	//Reposition to 0,halfY,0
	// 	gltf.scene.position.copy(cent).multiplyScalar(-1);
	// 	gltf.scene.position.y = 0;
	// 	gltf.scene.position.x += -3.5;
	// 	gltf.scene.position.z = 0;
	// 	gltf.scene.visible = true;
	
	// 	house = gltf.scene;
	// 	house.rotation.y = - 0.3 * Math.PI;
	// 	//add it to the scene
	// 	all.add( house );

	// }, undefined, function ( e ) {
	// 	console.error( e );
	// } );

	//Load pic1
	var geometry = new THREE.PlaneGeometry(1, 1);
	var material = new THREE.MeshLambertMaterial();
	pic1 = new THREE.Mesh(geometry, material);
	//Get image from image.jpg
	var imageLoader = new THREE.TextureLoader().load('content/image0.jpg', (imgLoader) => {
		//Rescale and position image
		var targetWidth = 4;
		var targetHeight = targetWidth*imgLoader.image.height / imgLoader.image.width;
		pic1.scale.set(targetWidth, targetHeight, 1.0);
		pic1.position.x = -4;
		pic1.position.z = -1;
	});

	//Load the image into a custom material
	material = new THREE.MeshLambertMaterial({
	  map: imageLoader
	});
	//Add material to the image mesh
	pic1.material = material;
	pic1.visible = false;

	all.add(pic1);

	//Load pic2
	var geometry = new THREE.PlaneGeometry(1, 1);
	var material = new THREE.MeshLambertMaterial();
	pic2 = new THREE.Mesh(geometry, material);
	//Get image from image.jpg
	var imageLoader = new THREE.TextureLoader().load('content/image1.jpg', (imgLoader) => {
		//Rescale and position image
		var targetWidth = 4;
		var targetHeight = targetWidth*imgLoader.image.height / imgLoader.image.width;
		pic2.scale.set(targetWidth, targetHeight, 1.0);
		pic2.position.x = 3;
		pic2.position.z = -1;
	});

	//Load the image into a custom material
	material = new THREE.MeshLambertMaterial({
	  map: imageLoader
	});
	//Add material to the image mesh
	pic2.material = material;
	pic2.visible = false;

	all.add(pic2);

	//Load pic3
	var geometry = new THREE.PlaneGeometry(1, 1);
	var material = new THREE.MeshLambertMaterial();
	pic3 = new THREE.Mesh(geometry, material);
	//Get image from image.jpg
	var imageLoader = new THREE.TextureLoader().load('content/image2.jpg', (imgLoader) => {
		//Rescale and position image
		var targetWidth = 4;
		var targetHeight = targetWidth*imgLoader.image.height / imgLoader.image.width;
		pic3.scale.set(targetWidth, targetHeight, 1.0);
		pic3.position.x = -4;
		pic3.position.z = -1;
	});

	//Load the image into a custom material
	material = new THREE.MeshLambertMaterial({
	  map: imageLoader
	});
	//Add material to the image mesh
	pic3.material = material;
	pic3.visible = false;

	all.add(pic3);

	all.scale.multiplyScalar(0.4);
	//all.position.z = 0.5;
	arWorldRoot.add(all);
}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	if(isStart == true){
		video.play();
			video.pause();
			swal.close();
			isStart = false;
		}else{

		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

		raycaster.setFromCamera( mouse, camera );

		var videoPlaneArray = [videoPlane];

		var videoIntersects = raycaster.intersectObjects( videoPlaneArray );

		if ( videoIntersects.length > 0) {
			if(video.paused == true){
				video.play();
				isVideoPlay = true;
			}else{
				video.pause();
				isVideoPlay = false;
			}
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