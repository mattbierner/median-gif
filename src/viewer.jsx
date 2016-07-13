import React from 'react';
import ReactDOM from 'react-dom';

import loadGif from './loadGif';
import LabeledSelector from './labeled_selector';
import LabeledSlider from './labeled_slider';
import LoadingSpinner from './loading_spinner';
import GifPlayer from './gif_player';
import exportGif from './gif_export';

/**
 * Wrapping mode for frame selections
 */
const wrapModes = {
    'overflow': {
        title: 'Overflow',
        description: 'overflow'
    },
    'clamp': {
        title: 'Clamp',
        description: 'clamp'
    },
    'stop': {
        title: 'Stop',
        description: 'stop'
    }
};

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

/**
 * Wrapping mode for frame selections
 */
const sampleModes = {
    'forward': {
        title: 'Forwards',
        description: 'Select frames after the current frame'
    },
    'reverse': {
        title: 'Reverse',
        description: 'Select frames before the current frame.'
    },
    'bi': {
        title: 'Bi-Dirrectional',
        description: 'Select frames both before and after the current frame.'
    }
};

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
            reverseFrameOrder: false,
            bounceFrameOrder: false,
            initialFrame: 0,
            frameIncrement: 1,
            playbackSpeed: 1,

            // median
            wrapMode: Object.keys(wrapModes)[0],
            sampleMode: Object.keys(sampleModes)[0],
            numberOfFramesToSample: 1

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

                    playbackSpeed: 1,
                    reverseFrameOrder: false,
                    bounceFrameOrder: false,
                    initialFrame: 0,

                    frameIncrement: 1,

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

    onReverseFrameOrderChange(e) {
        const value = e.target.checked;
        this.setState({ reverseFrameOrder: value });
    }

    onBounceFrameOrderChange(e) {
        const value = e.target.checked;
        this.setState({ bounceFrameOrder: value });
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
                    <GifPlayer {...this.state} onRendererLoaded={this.onRendererLoaded.bind(this)} />
                </div>
                <div className="view-controls">
                    <WrapModeSelector value={this.state.wrapMode} onChange={this.onWrapModeChange.bind(this) } />
                    <SampleModeSelector value={this.state.sampleMode} onChange={this.onSampleModeChange.bind(this) } />

                    <div className="frame-controls">
                        <div className="full-width">
                            <LabeledSlider title='Frame Increment'
                                min="1"
                                max={this.state.imageData ? this.state.imageData.frames.length - 1 : 0}
                                value={this.state.frameIncrement}
                                onChange={this.onFrameIncrementChange.bind(this) }/>
                        </div>
                        <div className="full-width">
                            <LabeledSlider title='Initial Frame'
                                min="0"
                                max={this.state.imageData ? this.state.imageData.frames.length - 1 : 0}
                                value={this.state.initialFrame}
                                onChange={this.onInitialFrameChange.bind(this) }/>
                        </div>
                        <div className="full-width">
                            <LabeledSlider title='Sample Frames'
                                min="1"
                                max={this.state.imageData ? this.state.imageData.frames.length : 0}
                                value={this.state.numberOfFramesToSample}
                                onChange={this.onNumberOfFramesToSampleChanged.bind(this) }/>
                        </div>
                        <div>
                            <div className="control-group">
                                <div className='control-title'>Reverse Frames</div>
                                <input type="checkbox" value={this.state.reverseFrameOrder} onChange={this.onReverseFrameOrderChange.bind(this) }/>
                            </div>
                        </div>
                        <div>
                            <div className="control-group">
                                <div className='control-title'>Mirror Frames</div>
                                <input type="checkbox" value={this.state.bounceFrameOrder} onChange={this.onBounceFrameOrderChange.bind(this) }/>
                            </div>
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
};
