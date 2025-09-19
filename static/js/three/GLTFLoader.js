import {
	AnimationClip,
	Bone,
	FileLoader,
	Group,
	Loader,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	SkinnedMesh,
	TextureLoader,
	Vector3
} from '../three.module.js';

class GLTFLoader extends Loader {

	constructor( manager ) {
		super( manager );
	}

	load( url, onLoad, onProgress, onError ) {
		const loader = new FileLoader( this.manager );
		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		loader.load( url, ( buffer ) => {
			try {
				this.parse( buffer, onLoad );
			} catch ( e ) {
				if ( onError ) {
					onError( e );
				} else {
					console.error( e );
				}
				this.manager.itemError( url );
			}
		}, onProgress, onError );
	}

	parse( buffer, onLoad ) {
		// Basic GLTF parsing implementation
		const gltf = {
			scene: new Group(),
			animations: []
		};

		// Parse buffer and create scene
		const data = new Uint8Array( buffer );
		const magic = data.slice( 0, 4 ).reduce( ( acc, val ) => acc + String.fromCharCode( val ), '' );

		if ( magic === 'glTF' ) {
			// Binary GLTF
			this.parseBinary( data, gltf );
		} else {
			// JSON GLTF
			const text = new TextDecoder().decode( data );
			const json = JSON.parse( text );
			this.parseJSON( json, gltf );
		}

		onLoad( gltf );
	}

	parseBinary( data, gltf ) {
		// Simplified binary GLTF parsing
		const headerView = new DataView( data.buffer );
		const version = headerView.getUint32( 4, true );
		const length = headerView.getUint32( 8, true );

		if ( version !== 2 ) {
			throw new Error( 'GLTFLoader: Unsupported glTF version' );
		}

		// Parse chunks
		let offset = 12;
		while ( offset < length ) {
			const chunkLength = headerView.getUint32( offset, true );
			const chunkType = headerView.getUint32( offset + 4, true );
			offset += 8;

			if ( chunkType === 0x4E4F534A ) { // JSON chunk
				const jsonData = new Uint8Array( data.buffer, offset, chunkLength );
				const text = new TextDecoder().decode( jsonData );
				const json = JSON.parse( text );
				this.parseJSON( json, gltf );
			}

			offset += chunkLength;
		}
	}

	parseJSON( json, gltf ) {
		// Simplified JSON GLTF parsing
		if ( json.scenes && json.scenes.length > 0 ) {
			const defaultScene = json.scenes[ json.scene || 0 ];
			this.parseScene( defaultScene, json, gltf.scene );
		}

		if ( json.animations ) {
			json.animations.forEach( animation => {
				const clip = this.parseAnimation( animation, json );
				if ( clip ) gltf.animations.push( clip );
			} );
		}
	}

	parseScene( scene, json, parent ) {
		if ( scene.nodes ) {
			scene.nodes.forEach( nodeIndex => {
				const node = json.nodes[ nodeIndex ];
				const object = this.parseNode( node, json );
				if ( object ) parent.add( object );
			} );
		}
	}

	parseNode( node, json ) {
		let object;

		if ( node.mesh !== undefined ) {
			const mesh = this.parseMesh( json.meshes[ node.mesh ], json );
			object = mesh;
		} else {
			object = new Object3D();
		}

		if ( node.translation ) {
			object.position.fromArray( node.translation );
		}

		if ( node.rotation ) {
			object.quaternion.fromArray( node.rotation );
		}

		if ( node.scale ) {
			object.scale.fromArray( node.scale );
		}

		if ( node.name ) {
			object.name = node.name;
		}

		return object;
	}

	parseMesh( mesh, json ) {
		const geometry = this.parseGeometry( mesh.primitives[ 0 ], json );
		const material = new MeshStandardMaterial();

		if ( mesh.primitives[ 0 ].material !== undefined ) {
			Object.assign( material, this.parseMaterial( json.materials[ mesh.primitives[ 0 ].material ] ) );
		}

		return new Mesh( geometry, material );
	}

	parseGeometry( primitive, json ) {
		// Simplified geometry parsing
		const geometry = new BufferGeometry();

		if ( primitive.attributes.POSITION !== undefined ) {
			const accessor = json.accessors[ primitive.attributes.POSITION ];
			geometry.setAttribute( 'position', this.parseAccessor( accessor, json ) );
		}

		return geometry;
	}

	parseAccessor( accessor, json ) {
		const bufferView = json.bufferViews[ accessor.bufferView ];
		const itemSize = this.getItemSize( accessor.type );
		const count = accessor.count;
		const array = new Float32Array( count * itemSize );

		// Copy data from buffer
		const buffer = json.buffers[ bufferView.buffer ];
		const data = new DataView( buffer );
		let offset = bufferView.byteOffset || 0;

		for ( let i = 0; i < count; i ++ ) {
			for ( let j = 0; j < itemSize; j ++ ) {
				array[ i * itemSize + j ] = data.getFloat32( offset + ( i * itemSize + j ) * 4, true );
			}
		}

		return new BufferAttribute( array, itemSize );
	}

	getItemSize( type ) {
		switch ( type ) {
			case 'SCALAR': return 1;
			case 'VEC2': return 2;
			case 'VEC3': return 3;
			case 'VEC4': return 4;
			case 'MAT2': return 4;
			case 'MAT3': return 9;
			case 'MAT4': return 16;
			default: return 0;
		}
	}

	parseAnimation( animation, json ) {
		const tracks = [];

		animation.channels.forEach( channel => {
			const sampler = animation.samplers[ channel.sampler ];
			const target = channel.target;

			if ( target.node !== undefined ) {
				const node = json.nodes[ target.node ];
				const inputAccessor = json.accessors[ sampler.input ];
				const outputAccessor = json.accessors[ sampler.output ];

				const track = this.parseAnimationTrack(
					node,
					target.path,
					inputAccessor,
					outputAccessor,
					sampler.interpolation,
					json
				);

				if ( track ) tracks.push( track );
			}
		} );

		return new AnimationClip( animation.name, undefined, tracks );
	}

	parseAnimationTrack( node, path, input, output, interpolation, json ) {
		const times = this.parseAccessor( input, json ).array;
		const values = this.parseAccessor( output, json ).array;

		let TypedKeyframeTrack;

		switch ( path ) {
			case 'translation':
				TypedKeyframeTrack = VectorKeyframeTrack;
				break;
			case 'rotation':
				TypedKeyframeTrack = QuaternionKeyframeTrack;
				break;
			case 'scale':
				TypedKeyframeTrack = VectorKeyframeTrack;
				break;
			case 'weights':
				TypedKeyframeTrack = NumberKeyframeTrack;
				break;
			default:
				return null;
		}

		const trackName = node.name ? node.name : node.uuid;
		const trackNamePrefix = path === 'weights' ? trackName + '.morphTargetInfluences' : trackName + '.' + path;

		return new TypedKeyframeTrack(
			trackNamePrefix,
			times,
			values,
			interpolation === 'CUBICSPLINE' ? InterpolateSmooth : InterpolateLinear
		);
	}

}

export { GLTFLoader };