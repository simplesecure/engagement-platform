import React from 'reactn';
import Navbar from 'react-bootstrap/Navbar';
import Image from 'react-bootstrap/Image';

export default class Header extends React.Component {
  render() {
    return (
      <Navbar className="header-nav no-print" bg="dark" expand="lg">
        <Navbar.Brand className="brand-div"><Image className="sid-logo" src={require('../assets/img/full_logo_black.svg')} alt="SimpleID favicon" /></Navbar.Brand>
      </Navbar>
    )
  }
}
