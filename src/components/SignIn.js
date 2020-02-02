import React, { setGlobal } from 'reactn';
import { getCloudUser } from './../utils/cloudUser.js'
import Modal from 'react-bootstrap/Modal'
import Auth from './Auth.js'
import Header from './Header.js'
import Footer from './Footer.js'
import '../assets/css/widget.css'

export default class SignIn extends React.Component {

  render() {
    return (
      <Modal show={true}>
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
