import React from 'reactn';
import Table from 'react-bootstrap/Table';

export default class SegmentTable extends React.Component {
  constructor() {
    super()
    this.keyIdx=0
    this.proxyMode = true
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
      heading = `Wallet Address (100 / ${count})`
    }

    return (
      <div>
        <Table responsive>
          <thead>
            <tr>
              <th>{heading}</th>
              <th>{this.proxyMode ? 'Proxy Address' : 'Last Sign In'}</th>
            </tr>
          </thead>
          <tbody>
            {
              //TODO: the users returned here are just addresses right now. Need more info to be included
              users.map(user =>
              {
                let link = `https://etherscan.io/address/` + user
                let shortUser = user.slice(0, 6) + '...' + user.slice(-4)

                let result = undefined

                if (this.proxyMode) {
                  let proxyTd = (<td></td>)

                  const contractRandom = Math.floor(10*Math.random())
                  let contracts = []
                  let proxyAddresses = []
                  if (contractRandom <= 2) {
                    contracts.push('OasisDEX')
                    proxyAddresses.push('0xDAA2bB85C32a8DbdfE2858C0E41A1004F59912bA')
                    let shortProxyUser = proxyAddresses[0].slice(0, 6) + '...' + proxyAddresses[0].slice(-4) + ` (${contracts[0]})`
                    proxyTd = (
                      <td>
                        <a href={`https://etherscan.io/address/${proxyAddresses[0]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser}</a>
                      </td>
                    )
                  } else if (contractRandom <= 5) {
                    contracts.push('InstaDApp')
                    proxyAddresses.push('0x939Daad09fC4A9B8f8A9352A485DAb2df4F4B3F8')
                    let shortProxyUser = proxyAddresses[0].slice(0, 6) + '...' + proxyAddresses[0].slice(-4) + ` (${contracts[0]})`
                    proxyTd = (
                      <td>
                        <a href={`https://etherscan.io/address/${proxyAddresses[0]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser}</a>
                      </td>
                    )
                  } else if (contractRandom <= 7) {
                    contracts.push('OasisDEX')
                    contracts.push('InstaDApp')
                    proxyAddresses.push('0xDAA2bB85C32a8DbdfE2858C0E41A1004F59912bA')
                    proxyAddresses.push('0x939Daad09fC4A9B8f8A9352A485DAb2df4F4B3F8')
                    let shortProxyUser = proxyAddresses[0].slice(0, 6) + '...' + proxyAddresses[0].slice(-4) + ` (${contracts[0]})`
                    let shortProxyUser2 = proxyAddresses[1].slice(0, 6) + '...' + proxyAddresses[1].slice(-4) + ` (${contracts[1]})`
                    proxyTd = (
                      <td>
                        <a href={`https://etherscan.io/address/${proxyAddresses[0]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser}</a>
                        <hr />
                        <a href={`https://etherscan.io/address/${proxyAddresses[1]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser2}</a>
                      </td>
                    )
                  }

                  result = (
                    <tr key={this.getUniqueKey()}>
                      <td title={user}><a href={link} target="_blank" rel="noopener noreferrer">{shortUser}</a></td>
                      {proxyTd}
                    </tr>
                  )
                } else {
                  result = (
                    <tr key={this.getUniqueKey()}>
                      <td title={user}><a href={link} target="_blank" rel="noopener noreferrer">{shortUser}</a></td>
                      <td>Coming Soon...</td>
                    </tr>
                  )
                }

                return result
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
