import React from 'reactn';
import Table from 'react-bootstrap/Table';
import Nav from 'react-bootstrap/Nav';

export default class DemoTable extends React.Component {
  render() {
    const { seg } = this.props;
    console.log(seg);
    let users = seg.users ? seg.users : []
    return (
      <div>
        <Table responsive>
          <thead>
            <tr>
              <th>Wallet Address</th>
              <th>Email Available</th>
              <th>Provider</th>
              <th>Last Sign In</th>
            </tr>
          </thead>

          <tbody>
            {
              //TODO: the users returned here are just addresses right now. Need more info to be included
              users.map(user => {
                return (
                  <tr>
                    <td title={user}>{user.substring(0,8)}...</td>
                    <td>True</td>
                    <td>SimpleID</td>
                    <td>12/20/2019</td>
                  </tr>
                )
              })
            }
          </tbody>
        </Table>
        <Nav className="justify-content-center" activeKey="link-0">
          <Nav.Item>
            <Nav.Link eventKey="link-0">1</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="link-1">2</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="link-2">3</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="link-3">4</Nav.Link>
          </Nav.Item>
        </Nav>
      </div>
    )
  }
}