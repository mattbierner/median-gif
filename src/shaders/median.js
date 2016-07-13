import THREE from 'three';
import gen from '../gen_array';

// Lookup the maximum number of textures allowed in a fragment shader.
// We reserve one for the accumulation buffer. 8 is the min.
let arraySizeValue = 6;
try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');

    arraySizeValue = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) - 1;
} catch (e) {
    arraySizeValue = 6;
}

export const arraySize = arraySizeValue;

export default {
    uniforms: {
        sourceTexture: { type: 't', value: new THREE.Texture() },

        frames: { type: 'tv', value: gen(arraySize, new THREE.Texture()) },
        frameWeights: { type: 'fv', value: gen(arraySize, 1.0 / arraySize) }
    },
    vertexShader: `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D sourceTexture;

        uniform sampler2D frames[${arraySize}];
        uniform float frameWeights[${arraySize}];

        varying vec2 vUv;
        
        void main() {
            vec4 sum = texture2D(sourceTexture, vUv);
            for(int i = 0; i < ${arraySize}; ++i) {
                sum += texture2D(frames[i], vUv) * frameWeights[i];
            }
            gl_FragColor = vec4(sum.xyz, 1.0);
        }
    `,
};