const GifEncoder = require('gif-encoder');
import MedianRenderer from './median_renderer';

/**
 * Exprt
 */
export default (imageData, sourceRenderer, props) => {
    const gif = new GifEncoder(imageData.width, imageData.height);

    const canvas = document.createElement("canvas");
    const renderer = new MedianRenderer(canvas);
    renderer.clone(sourceRenderer);

    const p = new Promise((resolve) => {
        const parts = [];
        gif.on('data', data => parts.push(data));
        gif.on('end', () => {
            const blob = new Blob(parts, { type: 'image/gif' });
            resolve(blob);
        });
    });

    gif.setRepeat(0); // infinite loop
    gif.writeHeader();

    setTimeout(() => {
        for (let i = 0; i < imageData.frames.length; ++i) {
            renderer.setOptions(Object.assign({ currentFrame: i }, props));
            gif.setDelay(imageData.frames[i].info.delay * 10);
            gif.addFrame(renderer.renderToBuffer());
        }
        gif.finish();
    }, 0);
    return p;
};