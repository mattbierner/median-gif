import THREE from 'three';
import gen from '../gen_array';

export const arraySize = 12;

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