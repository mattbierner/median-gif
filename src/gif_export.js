import MedianRenderer from './median_renderer';
import { hex } from 'chroma-js';

/**
 * Export
 */
export default function (imageData, sourceRenderer, props) {
    return import('./gifencoder.js').then(({ GifEncoder }) => {
        const canvas = document.createElement("canvas");
        const renderer = new MedianRenderer(canvas);
        renderer.clone(sourceRenderer);

        const width = imageData.width;
        const height = imageData.height;
        
        return new Promise((resolve) => {
            const encoder = new GifEncoder({ width, height });

            encoder.once('finished', (blob) => {
                resolve(blob);
            });

            for (let i = 0; i < imageData.frames.length; ++i) {
                renderer.setOptions(Object.assign({ currentFrame: i }, props));
                const delay = imageData.frames[i].info.delay * 10;
                encoder.addFrame(new ImageData(new Uint8ClampedArray(renderer.renderToBuffer()), width, height), delay);
            }

            encoder.render();
        });
    });
};