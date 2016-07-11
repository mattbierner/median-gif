import React from 'react';
import ReactDOM from 'react-dom';

import MedianRenderer from './median_renderer';

/**
 * Renders a median blended gif. 
 */
export default class GifRenderer extends React.Component {
    componentDidMount() {
        this._canvas = ReactDOM.findDOMNode(this);
        this._renderer = new MedianRenderer(this._canvas);

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
            <canvas className="gif-canvas"
                width={this.props.imageData ? this.props.imageData.width : 100}
                height={this.props.imageData ? this.props.imageData.height : 100}  />
        );
    }
};