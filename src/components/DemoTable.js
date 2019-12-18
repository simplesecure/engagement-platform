import React from 'reactn';
import Table from 'react-bootstrap/Table';
import Nav from 'react-bootstrap/Nav';

export default class DemoTable extends React.Component {
  render() {
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
            <tr>
              <td>0xf023...</td>
              <td>True</td>
              <td>SimpleID</td>
              <td>12/20/2019</td>
            </tr>
            <tr>
              <td>0xf023...</td>
              <td>False</td>
              <td>Portis</td>
              <td>12/20/2019</td>
            </tr>
            <tr>
              <td>0xf023...</td>
              <td>True</td>
              <td>Metamask</td>
              <td>12/20/2019</td>
            </tr>
            <tr>
              <td>0xf023...</td>
              <td>True</td>
              <td>Fortmatic</td>
              <td>12/20/2019</td>
            </tr>
            <tr>
              <td>0xf023...</td>
              <td>False</td>
              <td>Fortmatic</td>
              <td>12/20/2019</td>
            </tr>
            <tr>
              <td>0xf023...</td>
              <td>True</td>
              <td>SimpleID</td>
              <td>12/20/2019</td>
            </tr>
            <tr>
              <td>0xf023...</td>
              <td>True</td>
              <td>Argent</td>
              <td>12/20/2019</td>
            </tr>
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