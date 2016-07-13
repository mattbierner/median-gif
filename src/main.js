import React from 'react';
import ReactDOM from 'react-dom';

import Search from './search';
import Viewer from './viewer';

/**
 * Main application.
 */
class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedGif: "http://media3.giphy.com/media/3oxRmD9a5pLTOOLigM/giphy.gif"
        };
    }

    onGifSelected(src) {
        this.setState({ selectedGif: src });
        window.location = '#viewer';
    }

    render() {
        return (
            <div className="main container">
                <Viewer file={this.state.selectedGif} />
                <Search onGifSelected={this.onGifSelected.bind(this) } />
            </div>
        );
    }
};


ReactDOM.render(
    <Main />,
    document.getElementById('content'));