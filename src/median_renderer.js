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

        this.initMaterials();
        this.initGeometry()
    }

    initRenderer(canvas) {
        this._renderer = new THREE.WebGLRenderer({
            canvas: canvas
        });
        this._renderer.setClearColor(0xffffff, 0);
        this._renderer.setPixelRatio(1);
    }

    initMaterials() {
        this._material = new THREE.ShaderMaterial(median_shader).clone();
        this._materialScreen = new THREE.ShaderMaterial(screen_shader).clone();
    }

    initGeometry() {
        const plane = new THREE.PlaneGeometry(2, 2);

        this._sceneRTT.add(new THREE.Mesh(plane, this._material));
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
    }

    clone(renderer) {
        this._frames = renderer._frames;
        this._options = renderer._options;
        this.resize(renderer._width, renderer._height);
    }

    resize(width, height) {
        this._width = width;
        this._height = height;
        this._camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -10000, 10000);
        this._camera.position.z = 100;

        this._rtTexture1 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat,
            depthBuffer: false,
            stencilBuffer: false
        });

        this._rtTexture1.texture.wrapS = THREE.RepeatWrapping;
        this._rtTexture1.texture.wrapT = THREE.RepeatWrapping;

        this._rtTexture2 = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat,
            depthBuffer: false,
            stencilBuffer: false
        });

        this._renderer.setSize(width, height);
    }

    /**
     * Main render function.
     */
    render() {
        const tex = this.renderMedian(this._options);
        this.renderToScreen(tex.texture || tex);
    }

    _ensureDataBuffer(width, height) {
        const size = 4 * width * height;
        if (!this._dataBuffer || this._dataBuffer.length !== size) {
            this._dataBuffer = new Uint8Array(size);
        }
        return this._dataBuffer;
    }

    renderToBuffer() {
        const tex = this.renderMedian(this._options);
        
        const {width, height} = tex;
        const pixels = this._ensureDataBuffer(width, height);

        this._materialScreen.uniforms.flip.value = 1;
        this._materialScreen.uniforms.flip.needsUpdate = true;

        this.renderToScreen(tex.texture || tex);
        const gl = this._renderer.getContext();
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
    }

    /**
     * Renders `texture` to the screen.
     */
    renderToScreen(texture) {
        this._materialScreen.uniforms.tDiffuse.value = texture;
        this._materialScreen.uniforms.tDiffuse.needsUpdate = true;

        this._renderer.render(this._scene, this._camera);
    }

    /**
     * Render for median blending. Renders to a texture.
     */
    renderMedian(options) {
        const {initialFrame, frameIncrement, sampleMode, numberOfFramesToSample, wrapMode, weightFunction} = options;
        const currentFrame = options.currentFrame + initialFrame;

        if (sampleMode === 'bi') {
            const backwards = this.renderMedianImpl(emptyTexture, 0.5, currentFrame - 1, -frameIncrement, numberOfFramesToSample, wrapMode, weightFunction);
            return this.renderMedianImpl(backwards.texture || backwards, 0.5, currentFrame, frameIncrement, numberOfFramesToSample, wrapMode, weightFunction);
        }
        
        return this.renderMedianImpl(
            emptyTexture,
            1,
            currentFrame,
            sampleMode === 'reverse' ? -frameIncrement : frameIncrement,
            numberOfFramesToSample,
            wrapMode,
            weightFunction);
    }

    renderMedianImpl(source, mul, initialFrame, frameIncrement, numberOfFramesToSample, wrapMode, weightFunction) {
        let dest = source === this._rtTexture1.texture ? this._rtTexture2 : this._rtTexture1;

        let totalWeight = 0;
        for (let i = 0; i < numberOfFramesToSample; ++i) {
            const weight = weightFunction(i, numberOfFramesToSample);
            totalWeight += weight;
        }
        const getWeight = (i) => weightFunction(i, numberOfFramesToSample) / totalWeight;
    
        for (let startFrame = 0; startFrame < numberOfFramesToSample; startFrame += median_shader_config.arraySize) {
            const textures = gen_array(median_shader_config.arraySize, emptyTexture);
            const weights = gen_array(median_shader_config.arraySize, 0);

            for (let i = 0; i < median_shader_config.arraySize && startFrame + i < numberOfFramesToSample; ++i) {
                const sampleNumber  = startFrame + i;
                const index = initialFrame + (sampleNumber * frameIncrement);
                const [tex, weight] = this.getFrame(getWeight, sampleNumber, index, wrapMode);
                textures[i] = tex;
                weights[i] = weight * mul;
            }
            
            source = this.renderGifFrames(textures, weights, source, dest);
            dest = (dest === this._rtTexture1 ? this._rtTexture2 : this._rtTexture1); 
        }
        return source;
    }

    /**
     * Renders a number of gif frames to a texture.
     */
    renderGifFrames(frames, weights, source, dest) {
        this._material.uniforms.frames.value = frames
        this._material.uniforms.frames.needsUpdate = true;

        this._material.uniforms.frameWeights.value = weights;
        this._material.uniforms.frameWeights.needsUpdate = true;

        this._material.uniforms.sourceTexture.value = source
        this._material.uniforms.sourceTexture.needsUpdate = true;

        this._renderer.render(this._sceneRTT, this._camera, dest, true);
        return dest;
    }

    /**
     * Get the frame and frameWeight of a frame for a given index in the gif.
     */
    getFrame(weightFunction, sampleNumber, index, wrapMode) {
        const len = this._frames.length;
        let sampleWeight = weightFunction(sampleNumber); 
        let sampleIndex = index;
        switch (wrapMode) {
        case 'clamp':
        {
            sampleIndex = Math.max(0, Math.min(index, len - 1));
            break;
        }

        case 'stop':
        {
            if (sampleIndex < 0 || sampleIndex > len) {
                return [emptyTexture, 0];
            }
            break;
        }

        case 'mirror':
        {
            sampleIndex %= len * 2;
            if (sampleIndex < 0)
                sampleIndex = len * 2 - 1 - Math.abs(sampleIndex);
            if (sampleIndex >= len)
                sampleIndex = len - 1 - (sampleIndex - len);
            break;
        }

        case 'overflow':
        default:
        {
            sampleIndex %= len;
            if (sampleIndex < 0)
                sampleIndex = (len - Math.abs(sampleIndex)) % len;
            break;
        }
        }

        return [this._frames[sampleIndex], sampleWeight];
    }
}