if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var views, scene, renderer;

var mesh, group1, group2, group3, light;

var windowWidth, windowHeight;

//Web Audio API
var audioContext = null;
var analyser = null;
var mediaStreamSource = null;
var mode = 0;
var fftSize = 2048;

//rendering
var geometry, plane;
var material = new THREE.MeshBasicMaterial({
  color: 0x00b2ff
});
var x_division, y_division;

var views = [
	{
		left: 0,
		bottom: 0.333,
		width: 0.333,
		height: 0.333,
		background: new THREE.Color().setRGB( 0.0, 0.0, 0.0 ),
		eye: [ -50, 50, 0 ],
		up: [ 0, 1, 0 ],
		fov: 45,					
	},
	{
		left: 0.333,
		bottom: 0.666,
		width: 0.333,
		height: 0.333,
		background: new THREE.Color().setRGB( 0.0, 0.0, 0.0 ),
		eye: [ 0, 50, -50 ],
		up: [ 0, 1, 0 ],
		fov: 45,
	},
	{
		left: 0.666,
		bottom: 0.333,
		width: 0.333,
		height: 0.333,
		background: new THREE.Color().setRGB( 0.0, 0.0, 0.0 ),
		eye: [ 50, 50, 0 ],
		up: [ 0, 1, 0 ],
		fov: 45,
	},
	{
		left: 0.333,
		bottom: 0.0,
		width: 0.333,
		height: 0.333,
		background: new THREE.Color().setRGB( 0.0, 0.0, 0.0 ),
		eye: [ 0, 50, 50 ],
		up: [ 0, 1, 0 ],
		fov: 45,					
	}
];

window.onload = function() {
	audioContext = new (window.AudioContext||window.webkitAudioContext)();
	init();
};

//main function end
//followings are functions used above
// ---------------------------------------------------------------------------------------

function init() {

	container = document.getElementById( 'container' );

	for (var ii =  0; ii < views.length; ++ii ) {

		var view = views[ii];
		camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.x = view.eye[ 0 ];
		camera.position.y = view.eye[ 1 ];
		camera.position.z = view.eye[ 2 ];
		camera.up.x = view.up[ 0 ];
		camera.up.y = view.up[ 1 ];
		camera.up.z = view.up[ 2 ];
		view.camera = camera;
	}

	scene = new THREE.Scene();
	
	light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( 20, 40, 15 );
	light.target.position.copy( scene.position );
	light.castShadow = true;
	light.shadowCameraLeft = -60;
	light.shadowCameraTop = -60;
	light.shadowCameraRight = 60;
	light.shadowCameraBottom = 60;
	light.shadowCameraNear = 20;
	light.shadowCameraFar = 200;
	light.shadowBias = -.0001
	light.shadowMapWidth = light.shadowMapHeight = 2048;
	light.shadowDarkness = .7;
	scene.add(light);
	

	x_division = 25;
	y_division = 12;
	geometry = new THREE.PlaneGeometry(50, 50, x_division, y_division);
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	plane = new THREE.Mesh(geometry, material);
	plane.castShadow = true;
	plane.receiveShadow = true;
	plane.rotation.x = Math.PI / -2;
	scene.add(plane);
	

	var size = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth;
	windowWidth  = size;
	windowHeight = size;
	// renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer = new THREE.WebGLRenderer();
	renderer.shadowMapEnabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize ( windowWidth, windowHeight );
	container.appendChild( renderer.domElement );
	// document.body.appendChild(renderer.domElement);

	stats = new Stats();
	container.appendChild( stats.dom );
	// document.body.appendChild(stats.dom);	
}

function animate() {

	updatePlane();

	render();
	stats.update();

	requestAnimationFrame( animate );
}

function render() {

	console.log(windowWidth+","+windowHeight);

	for ( var ii = 0; ii < views.length; ++ii ) {

		view = views[ii];
		camera = view.camera;

		camera.lookAt( scene.position );

		var left   = Math.floor( windowWidth  * view.left );
		var bottom = Math.floor( windowHeight * view.bottom );
		var width  = Math.floor( windowWidth  * view.width );
		var height = Math.floor( windowHeight * view.height );
		renderer.setViewport( left, bottom, width, height );
		renderer.setScissor( left, bottom, width, height );
		renderer.setScissorTest( true );
		renderer.setClearColor( view.background );

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.render( scene, camera );
		
	}

}

function error() {
    alert('Stream generation failed.');
}

/*navigatorってのはブラウザに備え付けのもの。||でつながってるのは、ブラウザの種類ごとに名前が違うため、存在する名前を保存して使うようにしている。*/
function getUserMedia(dictionary, callback) {
    try {
        navigator.getUserMedia =
          navigator.getUserMedia ||
          navigator.webkitGetUserMedia ||
          navigator.mozGetUserMedia;
        navigator.getUserMedia(dictionary, callback, error);
    } catch (e) {
        alert('getUserMedia threw exception :' + e);
    }
}


//streamがおそらくマイクからとった音声データ
function gotStream(stream) {
  // Create an AudioNode from the stream
  //Set a microphone as a source of audio
  mediaStreamSource = audioContext.createMediaStreamSource(stream);

  // Connect it to the destination.
  analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  mediaStreamSource.connect(analyser);

  animate();

}


function toggleLiveInput() {
  getUserMedia({
    "audio":{
      "mandatory":{
        "googEchoCancellation": "false",
        "googAutoGainControl": "false",
        "googNoiseSuppression": "false",
        "googHighpassFilter": "false"
      },
      //if possible, set this parameter
      "optional": []
    },
  },gotStream);
}


function updatePlane() {
  plane.geometry.verticesNeedUpdate = true;
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	plane.castShadow = true;
	plane.receiveShadow = true;
  var offset = 128;

  var bufferLength = analyser.frequencyBinCount;
  var data = new Uint8Array(bufferLength);
  
  if (mode == 0) analyser.getByteFrequencyData(data);
  else analyser.getByteTimeDomainData(data); //Waveform Data

  for (var i = plane.geometry.vertices.length - 1; i > x_division; i--) {
    plane.geometry.vertices[i].z = plane.geometry.vertices[i - x_division - 1].z;
    console.log(plane.geometry.vertices[i - x_division - 1].z);
  }

  var interval = Math.floor(data.length / x_division);
  
  for (var i = 0; i < x_division + 1; i++) {
    plane.geometry.vertices[i].z = data[i*interval] - offset;
  }

  
}

function setParameter(){
  mode = document.getElementById("mode").selectedIndex;
}

