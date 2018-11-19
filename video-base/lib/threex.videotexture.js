var THREEx = THREEx || {}

THREEx.VideoTexture	= function(url){
	// create the video element
	var video	= document.createElement('video');
	video.width	= 320;
	video.height	= 240;
	video.setAttribute("playsinline", true);
	video.src	= url;
	// expose video as this.video
	this.video	= video

	console.log(video);

	// create the texture
	var texture	= new THREE.Texture( video );
	// expose texture as this.texture
	this.texture	= texture

	/**
	 * update the object
	 */
	this.update	= function(){
		if( video.readyState !== video.HAVE_ENOUGH_DATA )	return;
		texture.needsUpdate	= true;		
	}

	/**
	 * destroy the object
	 */
	this.destroy	= function(){
		video.pause()
	}
}

//<iframe width="560" height="315" src="https://www.youtube.com/embed/SZ2rjudcD4s" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

THREEx.YoutubeVideoTexture	= function(url){
	// create the video element
	var video	= document.createElement('iframe');
	video.width	= 560;
	video.height	= 315;
	video.setAttribute("playsinline", true);
	video.src	= url;
	video.frameborder = 0;
	video.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
	//video.setAttribute("allowfullscreen", true);
	// expose video as this.video
	this.video	= video

	console.log(video);

	// create the texture
	var texture	= new THREE.Texture( video );
	// expose texture as this.texture
	this.texture	= texture

	/**
	 * update the object
	 */
	this.update	= function(){
		if( video.readyState !== video.HAVE_ENOUGH_DATA )	return;
		texture.needsUpdate	= true;		
	}

	/**
	 * destroy the object
	 */
	this.destroy	= function(){
		video.pause()
	}
}