if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

//scene is used to off-screne-rendering
var views, scene, renderer, mainScene, mainCamera;
var near = 1;
var far  = 75;

var light, mainLight;

var windowWidth, windowHeight;

//lenght is 4  in this program(front, right, back and left view)
var renderTarget = [];
var planeMat = [];
var texSize = 50;

//Web Audio API
var audioContext = null;
var analyser = null;
var mediaStreamSource = null;
var mode = 1;
var fftSize = 2048;

//rendering
var geometry, plane;
var material = new THREE.MeshBasicMaterial({
  color: 0x00b2ff
});
var attachTextureGeometry = [];
var mainMeshes = [];
var testGeometry, testMaterial, testMesh;


var x_division, y_division;
// var cmaeraDistance_y = 45;
// var cmaeraDistance_xz = 15;
var cmaeraDistance_y = 10
var cmaeraDistance_xz = 50;

var views = [
	{
		eye: [ 0, cmaeraDistance_y, cmaeraDistance_xz ],
		up: [ 0, 1, 0 ],
		fov: 60,					
	},
	{
		eye: [ cmaeraDistance_xz, cmaeraDistance_y, 0 ],
		up: [ 0, 1, 0 ],
		fov: 60,
	},
	{
		eye: [ 0, cmaeraDistance_y, -cmaeraDistance_xz ],
		up: [ 0, 1, 0 ],
		fov: 60,
	},
	{
		eye: [ -cmaeraDistance_xz, cmaeraDistance_y, 0 ],
		up: [ 0, 1, 0 ],
		fov: 60,					
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

	var size = window.innerHeight < window.innerWidth ? window.innerHeight : window.innerWidth;
	windowWidth  = size;
	windowHeight = size;

	scene = new THREE.Scene();

	for (var ii =  0; ii < views.length; ++ii ) {

		var view = views[ii];
		camera = new THREE.PerspectiveCamera( view.fov, windowWidth / windowHeight, 1, 100);
		camera.position.x = view.eye[ 0 ];
		camera.position.y = view.eye[ 1 ];
		camera.position.z = view.eye[ 2 ];
		camera.up.x = view.up[ 0 ];
		camera.up.y = view.up[ 1 ];
		camera.up.z = view.up[ 2 ];
		camera.aspect = windowWidth / windowHeight;
		camera.lookAt(scene.position);
		view.camera = camera;
	}

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
	
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	// renderer = new THREE.WebGLRenderer();
	renderer.shadowMapEnabled = true;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize ( windowWidth, windowHeight );
	container.appendChild( renderer.domElement );
	

	x_division = 20;
	y_division = 6;
	geometry = new THREE.PlaneGeometry(texSize, texSize, x_division, y_division);
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	plane = new THREE.Mesh(geometry, material);
	plane.castShadow = true;
	plane.receiveShadow = true;
	plane.rotation.x = Math.PI / -2;
	scene.add(plane);

	stats = new Stats();
	container.appendChild( stats.dom );

	for (var i = 0; i < views.length; i++) {
		renderTarget[i] = new THREE.WebGLRenderTarget(windowWidth / 3, windowHeight / 3, {
			 magFilter: THREE.NearestFilter,
			 minFilter: THREE.NearestFilter,
			 wrapS: THREE.ClampToEdgeWrapping,
			 wrapT: THREE.ClampToEdgeWrapping
		});

		planeMat[i] = new THREE.MeshLambertMaterial({
		    color: 0xffffff,
		    map: renderTarget[i],
		    side: THREE.DoubleSide
		});

		attachTextureGeometry[i] = new THREE.PlaneGeometry(texSize, texSize, 1, 1);

		mainMeshes[i] = new THREE.Mesh(attachTextureGeometry[i], planeMat[i]);
	}

	mainScene = new THREE.Scene();

	// mainCamera = new THREE.PerspectiveCamera(90, windowWidth / windowHeight, near, far+1);
	mainCamera = new THREE.OrthographicCamera(-texSize*3/2, texSize*3/2, texSize*3/2, -texSize*3/2, 1, 2);
	mainCamera.position.set(0, 1, 0);
	mainCamera.up.x = 0;
	mainCamera.up.y = 0;
	mainCamera.up.z = -1;
	mainCamera.lookAt(mainScene.position);
	// camera.lookAt(mainScene.position);

	mainMeshes[0].position.set(0, 0, 50);
	mainMeshes[1].position.set(50, 0, 0);
	mainMeshes[2].position.set(0, 0, -50);
	mainMeshes[3].position.set(-50, 0, 0);


	for (var i = 0; i < views.length; i++) {
		
		mainMeshes[i].rotation.x = Math.PI / -2;
		mainScene.add(mainMeshes[i]);
	}

	mainMeshes[1].rotation.z = Math.PI / 2;
	mainMeshes[2].rotation.z = Math.PI;
	mainMeshes[3].rotation.z = Math.PI / -2;

	
	mainLight = new THREE.DirectionalLight( 0xffffff);
	mainLight.position.set( 0, 50, 0);
	mainLight.target.position.copy( mainScene.position );

	mainScene.add(mainLight);

	// testGeometry = new THREE.CubeGeometry( 30, 30, 30 );
	// testMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
	// testMesh = new THREE.Mesh( testGeometry, testMaterial );
	// testMesh.position.set(0, 0, 0);
	// mainScene.add(testMesh);
	// renderer.render(mainScene, mainCamera);

}

function animate() {

	updatePlane();

	render();
	renderer.render(mainScene, mainCamera);
	stats.update();

	requestAnimationFrame( animate );
}

function render() {

	for ( var ii = 0; ii < views.length; ++ii ) {

		view = views[ii];
		camera = view.camera;
		mainMeshes[ii].material.needsUpdate = true;

		// renderer.setClearColor( view.background );
		// camera.updateProjectionMatrix();

		renderer.render( scene, camera, renderTarget[ii] );
		
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
   var tuning = 5.0;

   var bufferLength = analyser.frequencyBinCount;
   var data = new Uint8Array(bufferLength);
  
   if (mode == 0) analyser.getByteFrequencyData(data);
   else analyser.getByteTimeDomainData(data); //Waveform Data

   //move data forward
   for (var i = plane.geometry.vertices.length - 1; i > x_division; i--) {
     plane.geometry.vertices[i].z = plane.geometry.vertices[i - x_division - 1].z;
   }

   var interval = Math.floor(data.length / x_division);
  
  //get data from microphon input
   for (var i = 0; i < x_division + 1; i++) {
     // plane.geometry.vertices[i].z = (data[i*interval] - offset) / tuning;
     plane.geometry.vertices[i].z = (data[i*3] - offset) / tuning;
     // if (plane.geometry.vertices[i].z > 5) plane.geometry.vertices[i].z /= tuning;
   }
   console.log(plane.geometry.vertices[0].z);

  
}

function setParameter(){
  mode = document.getElementById("mode").selectedIndex;
}

