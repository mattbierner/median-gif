import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Generic selector controls
 */
export default class Selector extends React.Component {
    render() {
        const modeOptions = Object.keys(this.props.options).map(x =>
            <option value={x} key={x}>{this.props.options[x].title}</option>);
        return (
            <div className="control-group">
                <span className="control-title">{this.props.title} </span>
                <select value={this.props.value} onChange={this.props.onChange }>
                    {modeOptions}
                </select>
                <div className="control-description">{this.props.options[this.props.value].description}</div>
            </div>
        );
    }
}
