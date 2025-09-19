import {
	EventDispatcher,
	MATH_PI as PI,
	Quaternion,
	Spherical,
	Vector2,
	Vector3
} from '../three.module.js';

const _changeEvent = { type: 'change' };
const _startEvent = { type: 'start' };
const _endEvent = { type: 'end' };

class OrbitControls extends EventDispatcher {

	constructor( camera, domElement ) {
		super();

		this.camera = camera;
		this.domElement = domElement;

		// Set to false to disable this control
		this.enabled = true;

		// "target" sets the location of focus, where the object orbits around
		this.target = new Vector3();

		// How far you can dolly in and out
		this.minDistance = 0;
		this.maxDistance = Infinity;

		// How far you can orbit vertically, upper and lower limits
		this.minPolarAngle = 0;
		this.maxPolarAngle = PI;

		// How far you can orbit horizontally, upper and lower limits
		this.minAzimuthAngle = - Infinity;
		this.maxAzimuthAngle = Infinity;

		// Set to true to enable damping (inertia)
		this.enableDamping = false;
		this.dampingFactor = 0.05;

		// This option actually enables dollying in and out
		this.enableZoom = true;
		this.zoomSpeed = 1.0;

		// Set to true to enable rotation
		this.enableRotate = true;
		this.rotateSpeed = 1.0;

		// Set to true to enable panning
		this.enablePan = true;
		this.panSpeed = 1.0;
		this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up

		// State
		const STATE = {
			NONE: - 1,
			ROTATE: 0,
			DOLLY: 1,
			PAN: 2,
			TOUCH_ROTATE: 3,
			TOUCH_PAN: 4,
			TOUCH_DOLLY_PAN: 5,
			TOUCH_DOLLY_ROTATE: 6
		};

		let state = STATE.NONE;

		// Current position in spherical coordinates
		const spherical = new Spherical();
		const sphericalDelta = new Spherical();

		let scale = 1;
		const panOffset = new Vector3();
		let zoomChanged = false;

		const rotateStart = new Vector2();
		const rotateEnd = new Vector2();
		const rotateDelta = new Vector2();

		const panStart = new Vector2();
		const panEnd = new Vector2();
		const panDelta = new Vector2();

		const dollyStart = new Vector2();
		const dollyEnd = new Vector2();
		const dollyDelta = new Vector2();

		const pointers = [];
		const pointerPositions = {};

		// Event handlers

		const onPointerDown = ( event ) => {
			if ( this.enabled === false ) return;

			if ( pointers.length === 0 ) {
				this.domElement.setPointerCapture( event.pointerId );
				this.domElement.addEventListener( 'pointermove', onPointerMove );
				this.domElement.addEventListener( 'pointerup', onPointerUp );
			}

			pointers.push( event );
			pointerPositions[ event.pointerId ] = { x: event.pageX, y: event.pageY };

			if ( event.pointerType === 'touch' ) {
				handleTouchStartDollyPan();
			} else {
				handleMouseDownRotate( event );
			}

			this.dispatchEvent( _startEvent );
		};

		const onPointerMove = ( event ) => {
			if ( this.enabled === false ) return;

			if ( event.pointerType === 'touch' ) {
				handleTouchMoveDollyPan( event );
			} else {
				handleMouseMoveRotate( event );
			}
		};

		const onPointerUp = ( event ) => {
			if ( this.enabled === false ) return;

			if ( event.pointerType === 'touch' ) {
				handleTouchEnd();
			}

			removePointer( event );

			if ( pointers.length === 0 ) {
				this.domElement.releasePointerCapture( event.pointerId );
				this.domElement.removeEventListener( 'pointermove', onPointerMove );
				this.domElement.removeEventListener( 'pointerup', onPointerUp );
			}

			this.dispatchEvent( _endEvent );

			state = STATE.NONE;
		};

		const onPointerCancel = ( event ) => {
			removePointer( event );
		};

		const onMouseWheel = ( event ) => {
			if ( this.enabled === false || this.enableZoom === false ) return;

			event.preventDefault();

			if ( event.deltaY < 0 ) {
				dollyIn( getZoomScale() );
			} else if ( event.deltaY > 0 ) {
				dollyOut( getZoomScale() );
			}

			this.dispatchEvent( _changeEvent );
		};

		// Event handlers - FSM: listen for events and reset state

		this.domElement.addEventListener( 'pointerdown', onPointerDown );
		this.domElement.addEventListener( 'pointercancel', onPointerCancel );
		this.domElement.addEventListener( 'wheel', onMouseWheel, { passive: false } );

		// Force an update at start
		this.update();
	}

	// Public methods

	update() {
		const position = this.camera.position;
		const offset = position.clone().sub( this.target );

		// Rotate
		if ( this.enableRotate ) {
			offset.applyQuaternion( this.camera.quaternion );
		}

		// Apply damping
		if ( this.enableDamping ) {
			position.addScaledVector( offset, this.dampingFactor );
		}

		// Look at target
		this.camera.lookAt( this.target );

		return false;
	}

	dispose() {
		this.domElement.removeEventListener( 'pointerdown', onPointerDown );
		this.domElement.removeEventListener( 'pointercancel', onPointerCancel );
		this.domElement.removeEventListener( 'wheel', onMouseWheel );
		this.domElement.removeEventListener( 'pointermove', onPointerMove );
		this.domElement.removeEventListener( 'pointerup', onPointerUp );
	}

}

export { OrbitControls };