import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Generic number input
 */
export default class LabeledNumberInput extends React.Component {
    onChange(e) {
        this.props.onChange(e.target.value);
    }

    render() {
        return (
            <div className="control-group number-input-control-group full-width">
                <span className="control-title">{this.props.title}: </span>
                <input type="number" step="0.01" value={this.props.value} onChange={this.onChange.bind(this)}/>
                <div className="control-description">{this.props.description}</div>
            </div>
        );
    }
}
