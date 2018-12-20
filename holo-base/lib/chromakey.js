ChromaKeyMaterial = function (url, width, height, keyColor) {
	THREE.ShaderMaterial.call(this);

	video = document.createElement('video');
	video.loop = false;
	video.src = url;
	video.setAttribute("playsinline", ""); 
	video.setAttribute("id", "video")
	video.load();

	var videoImage = document.createElement('canvas');
	if (window["webkitURL"]) document.body.appendChild(videoImage);
	videoImage.width = width;
	videoImage.height = height;
	videoImage.style.display="none";
	
	var keyColorObject = new THREE.Color(keyColor);

	var videoImageContext = videoImage.getContext('2d');
	// background color if no video present
	videoImageContext.fillStyle = '#' + keyColorObject.getHexString();
	videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

	var videoTexture = new THREE.Texture(videoImage);
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;

	this.update = function () {
		if (video.readyState === video.HAVE_ENOUGH_DATA) {
			videoImageContext.drawImage(video, 0, 0);
			if (videoTexture) {
				videoTexture.needsUpdate = true;
			}
		}
	}

	this.setValues({

		uniforms: {
			texture: {
				type: "t",
				value: videoTexture
			},
			color: {
				type: "c",
				value: keyColorObject
			}
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('fragmentShader').textContent,

		transparent: true
	});


}

ChromaKeyMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
