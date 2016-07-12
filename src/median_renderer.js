import THREE from 'three';

import gen_array from './gen_array';

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
        this.resize(imageData.width, imageData.height);

        if (options) {
           this.setOptions(options);
        }
    }

    setOptions(options) {
        this._options = options;
        this.render();
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



    renderToScreen(source) {
        this._materialScreen.uniforms.tDiffuse.value = source;
        this._materialScreen.uniforms.tDiffuse.needsUpdate = true;

        this._renderer.render(this._scene, this._camera);
    }

    render() {
        return this.renderToScreen(this.renderMedian(
            this._options.currentFrame,
            this._options.frameIncrement,
            this._options.sampleMode,
            this._options.numberOfFramesToSample,
            this._options.wrapMode));
    }

    renderMedian(initialFrame, frameIncrement, sampleMode, numberOfFramesToSample, wrapMode) {
        let source = emptyTexture;
        let dest = this._rtTexture1;

        const mul = sampleMode === 'reverse' ? -1 : 1

        for (let startFrame = 0; startFrame < numberOfFramesToSample; startFrame += median_shader_config.arraySize) {
            const textures = gen_array(median_shader_config.arraySize, emptyTexture);
            const weights = gen_array(median_shader_config.arraySize, 0);

            for (let i = 0; i < median_shader_config.arraySize && startFrame + i < numberOfFramesToSample; ++i) {
                const index = (initialFrame + mul * ((startFrame + i) * frameIncrement));
                const [tex, weight] = this.getFrame(index, wrapMode);
                textures[i] = tex;
                weights[i] = weight;
            }
            this._material.uniforms.frames.value = textures
            this._material.uniforms.frames.needsUpdate = true;

            this._material.uniforms.frameWeights.value = weights;
            this._material.uniforms.frameWeights.needsUpdate = true;

            this._material.uniforms.sourceTexture.value = source
            this._material.uniforms.sourceTexture.needsUpdate = true;

            this._renderer.render(this._sceneRTT, this._camera, dest, true);

            source = dest;
            dest = (dest === this._rtTexture1 ? this._rtTexture2 : this._rtTexture1); 
        }
        return source.texture || source;
    }

    getFrame(index, wrapMode) {
        switch (wrapMode) {
        case 'clamp':
        {
            const tex = this._frames[Math.max(0, Math.min(index, this._frames.length - 1))];
            const weight = 1.0 / (this._options.numberOfFramesToSample);
            return [tex, weight];
        }
        case 'stop':
        {
            if (tex < 0 || tex > this._frames.length) {
                return [emptyTexture, 0];
            }
            const tex = this._frames[index];
            const weight = 1.0 / (this._options.numberOfFramesToSample);
            return [tex, weight];
        }

        case 'overflow':
        default:
        {
            index %= this._frames.length;
            if (index < 0)
                index = this._frames.length - 1 - Math.abs(index);
            
            const tex = this._frames[index];
            const weight = 1.0 / (this._options.numberOfFramesToSample);
            return [tex, weight];
        }
        }
    }
}