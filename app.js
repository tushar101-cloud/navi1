document.addEventListener('DOMContentLoaded', () => {
    const startNavBtn = document.getElementById('start-navigation');
    const stopNavBtn = document.getElementById('stop-navigation');
    const positionDisplay = document.getElementById('position');
    let watchID;

    // Start navigation (track user position)
    startNavBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
            watchID = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    positionDisplay.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
                },
                (error) => console.error('Error getting position', error),
                { enableHighAccuracy: true }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    });

    // Stop navigation (stop tracking position)
    stopNavBtn.addEventListener('click', () => {
        if (watchID) {
            navigator.geolocation.clearWatch(watchID);
            positionDisplay.textContent = '';
        }
    });

    // Admin login
    const adminForm = document.getElementById('admin-form');
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
            const result = await response.json();
            if (result.success) {
                document.getElementById('location-form').style.display = 'block';
                alert('Admin logged in successfully');
            } else {
                alert('Invalid credentials');
            }
        } catch (err) {
            console.error('Login error', err);
        }
    });

    // Add new location
    const addLocationForm = document.getElementById('add-location');
    addLocationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const locationName = document.getElementById('location-name').value;
        const coordinates = document.getElementById('coordinates').value;

        try {
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ locationName, coordinates }),
            });
            const result = await response.json();
            if (result.success) {
                alert('Location added successfully');
            } else {
                alert('Error adding location');
            }
        } catch (err) {
            console.error('Error adding location', err);
        }
    });
});
let isNavigating = false;
let scene, camera, renderer;

// Initialize AR and Three.js scene
function initAR() {
  scene = new THREE.Scene();
  camera = new THREE.Camera();
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const arToolkitSource = new THREEx.ArToolkitSource({ sourceType: 'webcam' });
  arToolkitSource.init(() => {
    onResize();
  });

  const arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'https://cdn.rawgit.com/jeromeetienne/AR.js/master/aframe/examples/arjs-camera-param.patt',
    detectionMode: 'mono',
  });

  arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
  });

  const markerRoot = new THREE.Group();
  scene.add(markerRoot);

  const markerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: 'https://cdn.rawgit.com/jeromeetienne/AR.js/master/aframe/examples/marker.patt',
  });

  function animate() {
    requestAnimationFrame(animate);

    if (arToolkitSource.ready) {
      arToolkitContext.update(arToolkitSource.domElement);
      renderer.render(scene, camera);
    }
  }
  animate();
}

// Access camera and display video
async function enableCamera() {
  const cameraElement = document.getElementById('camera');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraElement.srcObject = stream;
    cameraElement.play();
    initAR();  // Initialize AR once the camera is ready
  } catch (error) {
    console.error('Error accessing camera:', error);
  }
}

// Start navigation logic
function startNavigation() {
  if (!isNavigating) {
    isNavigating = true;
    console.log('Navigation started...');
    enableCamera();//enable camera
    fetchLocations();
  }
}

// Stop navigation logic
function stopNavigation() {
  if (isNavigating) {
    isNavigating = false;
    console.log('Navigation stopped...');
  }
}

// Fetch stored locations from the backend and use them in AR
async function fetchLocations() {
  try {
    const response = await fetch('/api/locations');
    const locations = await response.json();
    console.log('Fetched locations:', locations);
    // Use the fetched locations to place markers or routes in AR
  } catch (error) {
    console.error('Error fetching locations:', error);
  }
}
// Enable camera when the page loads
window.onload = () => {
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', startNavigation);
  
    const stopBtn = document.getElementById('stop-btn');
    stopBtn.addEventListener('click', stopNavigation);
  };

// Handle window resize
function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

window.onload = enableCamera;
window.addEventListener('resize', onResize);
