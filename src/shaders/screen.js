"use strict";
const THREE = require('three');

export default {
    uniforms: {
        tDiffuse: { type: 't' }
    },
    vertexShader: `
        varying vec2 vUv;
        uniform float time;
        
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D tDiffuse;
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            gl_FragColor = color;
        }
    `,
};