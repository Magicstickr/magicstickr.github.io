// forked from makc's "Simplify this three.js drawing exmple" http://jsdo.it/makc/zXNX
var mouse = { x: 0, y: 0, down: false };

var scene, camera, renderer, raycaster = new THREE.Raycaster (), mesh;

const dotImg = document.getElementById('dot');

var canvas = document.createElement ('canvas');
canvas.width = 256; canvas.height = 256;

var context = canvas.getContext ('2d');
context.rect (0, 0, canvas.width, canvas.height);
context.fillStyle = 'aliceblue';
context.fill ();

var texture = new THREE.Texture (canvas);
texture.needsUpdate = true;

    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.y = -400;
    camera.position.z = 1000;
    camera.lookAt (scene.position );
    
    mesh = new THREE.Mesh(
        new THREE.PlaneGeometry( 1000, 1000 ),
        new THREE.MeshBasicMaterial( { map: texture } )
    );
    scene.add( mesh );

    var renderer    = new THREE.WebGLRenderer({
            antialias   : true,
            autoResize : true,
            alpha: true
        });
        renderer.setClearColor(new THREE.Color('lightgrey'), 0)
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.domElement.style.position = 'absolute'
        renderer.domElement.style.top = '0px'
        renderer.domElement.style.left = '0px'
        document.body.appendChild( renderer.domElement );
    
var handler = function (e) {
    console.log("Listenend");
    mouse.down = (e.buttons != 0);
    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

document.addEventListener ('mousemove', handler);
document.addEventListener ('mousedown', handler);


function animate() {
    
    requestAnimationFrame( animate );
    
    mesh.rotation.y = (2 * mouse.x - document.body.offsetWidth) * 1e-3;
    
    if (mouse.down) {
        var canvasRect = renderer.domElement.getBoundingClientRect ();

        raycaster.ray.origin.set (0, 0, 0);
        camera.localToWorld (raycaster.ray.origin);
        raycaster.ray.direction.set (
            ((mouse.x - canvasRect.left) / canvasRect.width) * 2 - 1,
            ((canvasRect.top - mouse.y) / canvasRect.height) * 2 + 1,
        0.5).unproject (camera).sub (raycaster.ray.origin).normalize ();

        var intersects = raycaster.intersectObject (scene, true);
        if (intersects && intersects[0]) {
            var x = intersects[0].uv.x * canvas.width;
            var y = (1 - intersects[0].uv.y) * canvas.height;
            
            context.beginPath ();
            var size = 5;
            context.drawImage(dotImg, x - size/2, y - size/2,size);context.fillStyle = 'black';
            context.fill ();

            texture.needsUpdate = true;
        }
    }
    
    renderer.render( scene, camera );
    
}

animate();