import React from 'react';
import ReactDOM from 'react-dom';

import loadGif from './loadGif';
import LabeledSelector from './labeled_selector';
import LabeledSlider from './labeled_slider';
import LoadingSpinner from './loading_spinner';
import GifPlayer from './gif_player';
import exportGif from './gif_export';

import sampleModes from './options/sample_modes';
import weightModes from './options/weight_modes';
import wrapModes from './options/wrap_modes';

/**
 * Control for selecting wrapping mode.
 */
class WrapModeSelector extends React.Component {
    render() {
        return (
            <LabeledSelector {...this.props} title="Wrap Mode" options={wrapModes} />
        );
    }
}

class WeightModeSelector extends React.Component {
    render() {
        return (
            <LabeledSelector {...this.props} title="Weight Mode" options={weightModes} />
        );
    }
}


/**
 * Control for selecting frame selection mode.
 */
class SampleModeSelector extends React.Component {
    render() {
        return (
            <LabeledSelector {...this.props} title="Sample Mode" options={sampleModes} />
        );
    }
}

/**
 * Displays an interative scanlined gif with controls. 
 */
export default class Viewer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            imageData: null,
            loadingGif: false,
            exporting: false,

            // playback
            initialFrame: 0,
            frameIncrement: 1,
            playbackSpeed: 1,

            // median
            wrapMode: Object.keys(wrapModes)[0],
            sampleMode: Object.keys(sampleModes)[0],
            numberOfFramesToSample: 1,
            weightMode: Object.keys(weightModes)[0],
        };
    }

    componentDidMount() {
        this.loadGif(this.props.file);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.file && newProps.file.length && newProps.file !== this.props.file) {
            this.loadGif(newProps.file);
        }
    }

    loadGif(file) {
        this.setState({ loadingGif: true });
        loadGif(file)
            .then(data => {
                if (file !== this.props.file)
                    return;

                this.setState({
                    imageData: data,
                    loadingGif: false,
                    error: null,

                    initialFrame: 0,
                    frameIncrement: 1,
                    playbackSpeed: 1,

                    // median
                    numberOfFramesToSample: Math.ceil(data.frames.length / 2)
                });
            })
            .catch(e => {
                if (file !== this.props.file)
                    return;

                console.error(e);
                this.setState({
                    imageData: [],
                    loadingGif: false,
                    error: 'Could not load gif'
                })
            });
    }

    onWrapModeChange(e) {
        const value = e.target.value;
        this.setState({ wrapMode: value });
    }

    onFrameIncrementChange(e) {
        const value = +e.target.value;
        this.setState({ frameIncrement: value });
    }

    onInitialFrameChange(e) {
        const value = +e.target.value;
        this.setState({ initialFrame: value });
    }

    onNumberOfFramesToSampleChanged(e) {
        const value = +e.target.value;
        this.setState({ numberOfFramesToSample: value });
    }

    onWeightModeChange(e) {
        const value = e.target.value;
        this.setState({ weightMode: value });
    }

    onSampleModeChange(e) {
        const value = e.target.value;
        this.setState({ sampleMode: value });
    }

    onExport() {
        if (!this._renderer)
            return;

        this.setState({ exporting: true });
        exportGif(this.state.imageData, this._renderer, this.state).then(blob => {
            this.setState({ exporting: false });
            const url = URL.createObjectURL(blob);
            window.open(url);
        });
    }

    onRendererLoaded(renderer) {
        this._renderer = renderer;
    }

    render() {
        return (
            <div className="gif-viewer" id="viewer">
                <div className="player-wrapper">
                    <GifPlayer {...this.state} onRendererLoaded={this.onRendererLoaded.bind(this) } />
                </div>
                <div className="view-controls">

                    <div className="frame-controls">
                        <div className="full-width">
                            <SampleModeSelector value={this.state.sampleMode} onChange={this.onSampleModeChange.bind(this) } />
                        </div>
                        <div className="full-width">
                            <LabeledSlider title='Sample Frames'
                                min="1"
                                max={this.state.imageData ? this.state.imageData.frames.length : 0}
                                value={this.state.numberOfFramesToSample}
                                onChange={this.onNumberOfFramesToSampleChanged.bind(this) }/>
                        </div>
                        <div className="full-width">
                            <LabeledSlider title='Frame Increment'
                                min="1"
                                max={this.state.imageData ? this.state.imageData.frames.length - 1 : 0}
                                value={this.state.frameIncrement}
                                onChange={this.onFrameIncrementChange.bind(this) }/>
                        </div>
                    </div>

                    <div className="frame-controls">
                        <div className="full-width">
                            <WeightModeSelector value={this.state.weightMode} onChange={this.onWeightModeChange.bind(this) } />
                        </div>
                        <div className="full-width">
                            <LabeledSlider title='Initial Frame'
                                min="0"
                                max={this.state.imageData ? this.state.imageData.frames.length - 1 : 0}
                                value={this.state.initialFrame}
                                onChange={this.onInitialFrameChange.bind(this) }/>
                        </div>
                    </div>

                    <div className="frame-controls">
                        <div className="full-width">
                            <WrapModeSelector value={this.state.wrapMode} onChange={this.onWrapModeChange.bind(this) } />
                        </div>
                        <div className="full-width">
                            <LabeledSlider title='Initial Frame'
                                min="0"
                                max={this.state.imageData ? this.state.imageData.frames.length - 1 : 0}
                                value={this.state.initialFrame}
                                onChange={this.onInitialFrameChange.bind(this) }/>
                        </div>
                    </div>

                    <div className="export-controls">
                        <button onClick={this.onExport.bind(this) }>Export to gif</button>
                        <div>
                            <LoadingSpinner active={this.state.exporting} />
                        </div>
                    </div>
                </div>
            </div>);
    }
}
