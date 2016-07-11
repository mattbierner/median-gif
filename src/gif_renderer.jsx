import React from 'react';
import ReactDOM from 'react-dom';

import MedianRenderer from './median_renderer';

/**
 * Renders a median blended gif. 
 */
export default class GifRenderer extends React.Component {
    componentDidMount() {
        this._container = ReactDOM.findDOMNode(this);
        this._canvas = this._container.getElementsByClassName('gif-canvas')[0];
        this._renderer = new MedianRenderer(this._canvas, this._container);

        this.drawGifForOptions(this.props.imageData);
    }

    componentWillReceiveProps(newProps) {
        if (this.props.imageData !== newProps.imageData) {
            this.drawGifForOptions(newProps.imageData);
        }
        if (this.props.currentFrame !== newProps.currentFrame) {
            this._renderer.setCurrentFrame(newProps.currentFrame);
        }
    }

    drawGifForOptions(imageData) {
        if (imageData) {
            this._renderer.setGif(imageData);
        }
    }

    render() {
        return (
            <div>
                <canvas className="gif-canvas" width="100" height="100" />
            </div>
        );
    }
};