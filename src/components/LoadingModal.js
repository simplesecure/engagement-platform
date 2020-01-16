import React from 'reactn';
import Spinner from 'react-bootstrap/Spinner'
export default class LoadingModal extends React.Component {
  render() {
    const { messageToDisplay } = this.props;
    return (
      <div className="text-center loading-message">
        <Spinner
            as="h3"
            animation="grow"
            size="lg"
            role="status"
            aria-hidden="true"
        />
        <h3>{messageToDisplay ? messageToDisplay : "Loading..."}</h3>
      </div>
    )
  }
}