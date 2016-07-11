import THREE from 'three';

import median_shader from './shaders/median';
import * as median_shader_config from './shaders/median';
import screen_shader from './shaders/screen';

const emptyTexture = new THREE.Texture();

export default class MedianRenderer {
    constructor(canvas) {
        this._frames = [];
        this._options = {};

        this._scene = new THREE.Scene();
        this._sceneRTT = new THREE.Scene();

        this.initRenderer(canvas);
        this.resize(100, 100);

        this.initGeometry()
    }

    initRenderer(canvas) {
        this._renderer = new THREE.WebGLRenderer({
            canvas: canvas
        });
        this._renderer.setClearColor(0xffffff, 0);
        this._renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    }

    initGeometry() {
        const plane = new THREE.PlaneGeometry(2, 2);

        this._material = new THREE.ShaderMaterial(median_shader);
        this._sceneRTT.add(new THREE.Mesh(plane, this._material));

        this._materialScreen = new THREE.ShaderMaterial(screen_shader);
        this._scene.add(new THREE.Mesh(plane, this._materialScreen));
    }

    setGif(imageData, options) {
        this._frames = [];
        for (const frame of imageData.frames) {
            const tex = new THREE.Texture(frame.canvas);
            tex.needsUpdate = true;
            this._frames.push(tex);
        }

        this._material.uniforms.frameWeight.value = 1.0 / (imageData.frames.length);
        this._material.uniforms.frameWeight.needsUpdate = true;

        this.resize(imageData.width, imageData.height);

        if (options) {
           this.setOptions(options);
        }
        this.setCurrentFrame(0);
    }

    setCurrentFrame(frame) {
        this._currentFrame = frame;
        this.animate();
    }

    setOptions(options) {
        this._options = options;
        console.log(options);
        this.animate();
    }

    resize(width, height) {
        this._camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -10000, 10000);
        this._camera.position.z = 100;

        this._rtTexture1 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        });

        this._rtTexture2 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        });

        this._renderer.setSize(width, height);
    }

    /**
     * Main update function.
     */
    update() {
       this._currentFrame++;
    }

    animate() {
        this.update();
        this.render();
    }

    renderToScreen(source) {
        this._materialScreen.uniforms.tDiffuse.value = source;
        this._materialScreen.uniforms.tDiffuse.needsUpdate = true;

        this._renderer.render(this._scene, this._camera);
    }

    render(delta) {
        switch (this._options.mode) {
        case 'median':
            return this.renderToScreen(this.renderMedian());
        }
    }

    renderMedian() {
        let source = emptyTexture;
        let dest = this._rtTexture1;

        for (let startFrame = this._currentFrame; startFrame < this._frames.length; startFrame += median_shader_config.arraySize) {
            const textures = [];
            for (let i = startFrame; i < startFrame + median_shader_config.arraySize && i < this._frames.length; ++i) {
                const tex = this._frames[i % this._frames.length];
                textures.push(tex);
            }
            this._material.uniforms.frames.value = textures
            this._material.uniforms.frames.needsUpdate = true;

            this._material.uniforms.sourceTexture.value = source
            this._material.uniforms.sourceTexture.needsUpdate = true;
            
            this._renderer.render(this._sceneRTT, this._camera, dest, true);

            source = dest;
            dest = dest === this._rtTexture1 ? this._rtTexture2 : this._rtTexture1; 
        }
        return source;
    }
}