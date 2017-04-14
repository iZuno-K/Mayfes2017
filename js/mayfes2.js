var audioContext = null;
var analyser = null;
var mediaStreamSource = null;
var mode = 0;

// for draw graph
var fftSize = 2048;
var rafID = null;
var offset = 0;
var material = new THREE.MeshBasicMaterial({
  color: 0x00b2ff
});
var renderingCount = 0;
// window.onload: HTMLの読み込みが完了してから実行する
window.onload = function() {
  //AudioContextをインスタンス化
  audioContext = new (window.AudioContext||window.webkitAudioContext)();
}
//for display

var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
var size = w < h ? w : h;


// Rendering settings
var renderer, scene;

scene = new THREE.Scene();

var light;
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

var fov = 60;
var aspect = 1.0; //size/size=1.0
var near = 1;
var far = 100;
var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0,50,50);
camera.lookAt(scene.position);

renderer = new THREE.WebGLRenderer();
renderer.shadowMapEnabled = true
renderer.setSize(size, size);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);


var x_division = 25;
var y_division = 12;
var geometry = new THREE.PlaneGeometry(50, 50, x_division, y_division);
geometry.computeFaceNormals();
geometry.computeVertexNormals();

var plane = new THREE.Mesh(geometry, material);
plane.castShadow = true;
plane.receiveShadow = true;
plane.rotation.x = Math.PI / -2;
scene.add(plane);
renderer.render(scene, camera);
console.log(plane.geometry.vertices);



//followings are functions used above
// ---------------------------------------------------------------------------------------
//エラー処理用の関数
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

  document.getElementById("min").value = analyser.minDecibels;
  document.getElementById("max").value = analyser.maxDecibels;
  // Setup();  

  DrawGraph();

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


function DrawGraph() {
  plane.geometry.verticesNeedUpdate = true;
  plane.geometry.computeFaceNormals();
  plane.geometry.computeVertexNormals();
  plane.castShadow = true;
  plane.receiveShadow = true;

  var offset = 128;
  var tuning = 200.0;

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


  renderer.render(scene, camera);
  renderingCount++;

  if (!window.requestAnimationFrame) window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  rafID = window.requestAnimationFrame(DrawGraph);

}

function setParameter(){
  mode = document.getElementById("mode").selectedIndex;
  analyser.minDecibels = parseFloat(document.getElementById("min").value);
  analyser.maxDecibels = parseFloat(document.getElementById("max").value);
  analyser.smoothingTimeConstant = parseFloat(document.getElementById("smoothing").value);
}


// setInterval(DrawGraph, 100);
