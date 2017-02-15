"use strict";
define(["three"],
function(THREE) {
	const UPS = 100; // Updates Per Second

	const ZERO_QUATERNION = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 0), 0);
	const TMP_QUATERNION = new THREE.Quaternion();
	const TMP_VECTOR3 = new THREE.Vector3();

	const INITIAL_BOX_DISTANCE = 1.52;
	const BOX_SIZE = 1;

	const MAIN_COLOR = 0xF7EED3;
	const BACK_COLOR = 0x1A2A3F;

	var viewWidth = 1;
	var viewHeight = 1;


	var cameraDistance = 10;

	var scene = new THREE.Scene();
	// var camera = new THREE.PerspectiveCamera(60, 1, Number.EPSILON, 1000);
	var camera = new THREE.OrthographicCamera(0, 0, 1, 1, 0, 1000);

	
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

	var mouseMoved = false;

	var initial = true;
	var startTime = 0;

	var stillSnapInterval = Math.PI / 4;

	var lastToggle = +Date.now();
	var motionFlag = false;
	var targetLightsFactor = 0;
	var targetBoxDistance = INITIAL_BOX_DISTANCE;
	var currentLightsFactor = targetLightsFactor;
	var currentBoxDistance = targetBoxDistance;


	var hemisphereLightIntensity = 0.5;
	var hemisphereLight = new THREE.HemisphereLight(0xB3E2FF, 0x8697BF, hemisphereLightIntensity);
	scene.add(hemisphereLight);

	var frontLightIntensity = 1;
	var frontLight = new THREE.PointLight(0xFFFFFF, frontLightIntensity, 0, 2);
	frontLight.position.set(0, BOX_SIZE * 2, cameraDistance);
	scene.add(frontLight);

	var sideLightsIntensity = 1;

	var leftLight = new THREE.PointLight(0xFF4488, sideLightsIntensity, INITIAL_BOX_DISTANCE * 4, 2);
	leftLight.position.set(-INITIAL_BOX_DISTANCE * 2.5, 0, BOX_SIZE * 2.5);
	scene.add(leftLight);

	var rightLight = new THREE.PointLight(0x44FF88, sideLightsIntensity, INITIAL_BOX_DISTANCE * 4, 2);
	rightLight.position.set(INITIAL_BOX_DISTANCE * 2.5, 0, BOX_SIZE * 2.5);
	scene.add(rightLight);

	var ambientLightIntensity = 1;
	var ambientLight = new THREE.AmbientLight(0xFFFFFF, ambientLightIntensity);
	scene.add(ambientLight);

	updateLightsIntensity();


	var cubes = [];

	function initializeCubes() {
		var cubeFaces = [
			[1,0,0,0,1,1],
			[0,0,0,0,1,1],
			[1,0,0,0,1,1]
		];

		for (var i = 0; i < 3; i++) {
			var highlightMat = new THREE.MeshPhongMaterial({color: MAIN_COLOR});
			highlightMat.shininess = 0;
			var plainMat = new THREE.MeshPhongMaterial({color: BACK_COLOR});
			plainMat.shininess = 60;
			var cubeMat = new THREE.MultiMaterial([highlightMat, plainMat]);

			var cubeGeom = new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE);
			for (var j = 0; j < 6; j++) {
				cubeGeom.faces[j * 2].materialIndex = cubeFaces[i][j];
				cubeGeom.faces[j * 2 + 1].materialIndex = cubeFaces[i][j];
			}

			var cube = new THREE.Mesh(cubeGeom, cubeMat);
			cube.userData.angularVelocity = ZERO_QUATERNION.clone();
			cube.userData.angularAcceleration = ZERO_QUATERNION.clone();

			cubes.push(cube);

			scene.add(cube);
		}


		cubes[0].rotation.z = Math.PI / 4;
		cubes[0].rotation.y = Math.asin(Math.tan(Math.PI / 10));

		var ca = Math.PI * 7 / 4;
		TMP_QUATERNION.setFromAxisAngle(
			TMP_VECTOR3.set(Math.cos(ca), Math.sin(ca), 0).normalize(), 
			-Math.PI / 8);
		cubes[1].rotation.setFromQuaternion(TMP_QUATERNION);

		cubes[2].rotation.z = Math.PI * 5 / 4;
		cubes[2].rotation.y = -Math.asin(Math.tan(Math.PI / 10));

		updateBoxDistance();
	}


	function updateBoxDistance() {
		for (var i = 0; i < 3; i++) {
			cubes[i].position.set((i-1) * currentBoxDistance, 0, 0);
		}
	}

	function updateLightsIntensity() {
		hemisphereLight.intensity = hemisphereLightIntensity * currentLightsFactor;
		frontLight.intensity = frontLightIntensity * currentLightsFactor;
		leftLight.intensity = sideLightsIntensity * currentLightsFactor;
		rightLight.intensity = sideLightsIntensity * currentLightsFactor;
		ambientLight.intensity = ambientLightIntensity * (1 - currentLightsFactor);
	}


	function update() {
		for (var i = 0; i < cubes.length; i++) {
			var cube = cubes[i];
			var angularVelocity = cube.userData.angularVelocity;
			var angularAcceleration = cube.userData.angularAcceleration;

			angularVelocity.normalize();

			var newQuaternion = cube.quaternion.clone();
			newQuaternion.premultiply(angularVelocity);
			cube.setRotationFromQuaternion(newQuaternion);

			// decay angular velocity
			if (2 * Math.acos(angularVelocity.w) > (motionFlag ? Math.PI * 0.001 : 0)) {
				angularVelocity.slerp(ZERO_QUATERNION, motionFlag ? 0.01 : 0.03);
			}

			if (motionFlag) {
				var t = +Date.now();
				// "random" angular acceleration
				var angularAccAcc = TMP_QUATERNION;
				angularAccAcc.setFromAxisAngle(
					TMP_VECTOR3.set(
						Math.sin(t * (i + 1) / 100 + i), 
						Math.sin(t * (i + 0.5) / 200 + 1 + i), 
						Math.sin(t * (i + 0.25) / 300 + 2 + i)).normalize(),
					Math.PI * 0.06 / UPS / UPS / UPS);
				angularAcceleration.premultiply(angularAccAcc);
				angularVelocity.premultiply(angularAcceleration);
			} else {
				// snap rotation to regular intervals
				var f = 0.02;
				if (initial) {
					f = 0.08;
					var elapsed = +Date.now() - startTime;
					if (elapsed > 3000) {
						f = 0;
					} else {
						f = f / (elapsed/100 + 1);
					}
				}
				cube.rotation.x += circleDelta(cube.rotation.x, Math.round(cube.rotation.x / stillSnapInterval) * stillSnapInterval) * f;
				cube.rotation.y += circleDelta(cube.rotation.y, Math.round(cube.rotation.y / stillSnapInterval) * stillSnapInterval) * f;
				cube.rotation.z += circleDelta(cube.rotation.z, Math.round(cube.rotation.z / stillSnapInterval) * stillSnapInterval) * f;
			}
		}

		currentLightsFactor += (targetLightsFactor - currentLightsFactor) * (motionFlag ? 0.02 : 0.03);
		currentBoxDistance += (targetBoxDistance - currentBoxDistance) * (motionFlag ? 0.01 : 0.03);
		updateLightsIntensity();
		updateBoxDistance();
	}

	function toggleMotion() {
		if (initial) {
			cubes[0].userData.angularVelocity.setFromAxisAngle(TMP_VECTOR3.set(0, 1, 0), -Math.PI / 8 / UPS);
			cubes[2].userData.angularVelocity.setFromAxisAngle(TMP_VECTOR3.set(0, 1, 0), Math.PI / 8 / UPS);
		}
		initial = false;
		lastToggle = +Date.now();
		motionFlag = !motionFlag;
		stillSnapInterval = Math.PI / (Math.floor(2 + Math.random() * 2) * Math.floor(1 + Math.random() * 2));
		targetLightsFactor = motionFlag ? 1 : 0;
		targetBoxDistance = motionFlag ? INITIAL_BOX_DISTANCE + 0.5 : INITIAL_BOX_DISTANCE;
	}


	function onClick(e) {
		toggleMotion();
	}

	function onScroll(e) {
		camera.position.y = -window.scrollY / cameraDistance / 8;
		frontLight.position.y = camera.position.y * 3 + BOX_SIZE * 2;
		TMP_VECTOR3.set(0, 0, -cameraDistance / 4);
		camera.lookAt(TMP_VECTOR3);
		if (motionFlag) {
			toggleMotion();
		}
	}

	function onMouseMove(e) {
		var oldX = mouse.x;
		var oldY = mouse.y;
		mouse.x = (e.clientX / viewWidth) * 2 - 1;
		mouse.y = -((e.clientY / viewHeight) * 2 - 1);

		if (!mouseMoved) {
			mouseMoved = true;
			return;
		}

		var dx = mouse.x - oldX;
		var dy = mouse.y - oldY;

		raycaster.setFromCamera(mouse, camera);
		var intersects = raycaster.intersectObjects(scene.children);

		var spinned = 0;

		for (var i = intersects.length - 1; i >= 0; i--) {
			var obj = intersects[i].object;
			var newQuaternion = obj.quaternion.clone();
			var dAngle = TMP_QUATERNION;
			var speed = Math.sqrt(dx * dx + dy * dy) * Math.PI * 0.5;
			dAngle.setFromAxisAngle(
				TMP_VECTOR3.set(-dy, dx, 0).normalize(),
				speed);
			obj.setRotationFromQuaternion(newQuaternion.premultiply(dAngle));
			obj.userData.angularVelocity.slerp(dAngle, 0.2);
			spinned += speed;
		}

		if (spinned > Math.PI * 0.02 && !motionFlag) {
			toggleMotion();
		}
	}


	initializeCubes();
	setInterval(update, 1000/UPS);
	setInterval(function() {
		if (+Date.now() - lastToggle > 8000) {
			toggleMotion();
		}
	}, 12000);


	function updateViewport(width, height) {
		if (camera.isPerspectiveCamera) {
			camera.aspect = width / height;
			camera.position.z = cameraDistance / camera.aspect;
		} else if (camera.isOrthographicCamera) {
			camera.left = -width / 2;
			camera.right = width / 2;
			camera.top = height / 2;
			camera.bottom = -height / 2;
			camera.zoom = Math.max(width, height) / cameraDistance;
			camera.position.z = cameraDistance;
		}
		camera.updateProjectionMatrix();
		viewWidth = width;
		viewHeight = height;
	}


	function randCenter() { return Math.random() - 0.5; }
	function circleDelta(a, b) {
		var d = b - a;
		while (d > Math.PI) {
			d -= Math.PI * 2;
		}
		while (d < -Math.PI) {
			d += Math.PI * 2;
		}
		return d;
	}

	return {
		update: updateViewport,
		onClick: onClick,
		onMouseMove: onMouseMove,
		onScroll: onScroll,
		init: function (width, height) {
			startTime = +Date.now();
			this.update();
			return {
				scene: scene,
				camera: camera,
				backgroundColor: BACK_COLOR
			}
		}
	};
});