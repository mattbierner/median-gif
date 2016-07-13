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
        
        if (this.props.imageData) {
            this._renderer.setGif(this.props.imageData, this.props);
        }

        if (this.props.onRendererLoaded)
            this.props.onRendererLoaded(this._renderer);

        this._renderer.render();
    }

    componentWillReceiveProps(newProps) {
        if (this.props.imageData !== newProps.imageData) {
            this._renderer.setGif(newProps.imageData);
        }
        this._renderer.setOptions(newProps);
        this._renderer.render();
    }

    render() {
        return (
            <canvas className="gif-canvas" />
        );
    }
};