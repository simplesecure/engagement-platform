import React from 'reactn';
import Modal from 'react-bootstrap/Modal'
import Auth from './Auth.js'
import Header from './Header.js'
import Footer from './Footer.js'
import '../assets/css/widget.css'

export default class SignIn extends React.Component {

  render() {
    return (
      <Modal id="sign-in-modal" className="sign-in-modal" show={true}>
        <Header />
        <Modal.Body>
          <Auth />
        </Modal.Body>
        <Modal.Footer>
          <Footer />
        </Modal.Footer>
      </Modal>
    )
  }
}
