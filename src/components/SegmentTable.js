import React from 'reactn';
import Table from 'react-bootstrap/Table';

export default class SegmentTable extends React.Component {
  constructor() {
    super()
    this.keyIdx=0
  }

  getUniqueKey() {
    return `DemoTable${this.keyIdx++}`
  }

  render() {
    const { seg } = this.props;
    let users = seg.users ? seg.users : []
    let count = users.length
    let heading = 'Wallet Addresses'
    if (count > 100) {
      users = users.slice(0, 99)
      heading = `Wallet Address (100 of ` + count + `)`
    }
    return (
      <div>
        <Table responsive>
          <thead>
            <tr>
              <th>{heading}</th>
              {/*<th>Provider</th>*/}
              <th>Last Sign In</th>
            </tr>
          </thead>

          <tbody>
            {
              //TODO: the users returned here are just addresses right now. Need more info to be included
              users.map(user =>
              {
                let link = `https://etherscan.io/address/` + user
                return (
                  <tr key={this.getUniqueKey()}>
                    <td title={user}><a href={link} target="_blank" rel="noopener noreferrer">{user}</a></td>
                    {/*<td>Coming Soon...</td>*/}
                    <td>Coming Soon...</td>
                  </tr>
                )
              })
            }
          </tbody>
        </Table>
       {/* //Need to implement pagination at some point
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
        */}
      </div>
    )
  }
}
