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


  getFakeEthBal() {
    // Distributes most eth balances as low but gives a few whales, see the
    // eqn.:
    //   - f(x) = 10,000 * (x / 100.0)^9
    // here:
    //   - https://www.desmos.com/calculator/kreo2ssqj8
    //
    const x = 100 * Math.random()
    const y = 10000 * Math.pow(x / 100.0, 9)
    return Number.parseFloat(y).toFixed(3)
  }

  render() {
    const { seg } = this.props;
    let users = seg.users ? seg.users : []
    let count = users.length
    let heading = 'Wallet Addresses'
    if (count > 100) {
      users = users.slice(0, 99)
      heading = `Wallet Address` // (100 / ${count})`
    }

    return (
      <div>
        <div style={{textAlign: 'left', paddingTop: 10, paddingBottom: 20}}>
          {Math.ceil(0.2*Math.random()*count)} emails<br/>
          {count} wallets<br/>
          Showing 1 - 100<br/>
          &lt;next button&gt;
        </div>
        <Table responsive>
          <thead>
            <tr>
              <th>{heading}</th>
              <th>{this.proxyMode ? 'Proxy Wallet(s)' : 'Last Sign In'}</th>
              <th>Balance</th>
              <th>Tokens</th>
              <th>Email</th>
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
                    let shortProxyUser = contracts[0] //proxyAddresses[0].slice(0, 6) + '...' + proxyAddresses[0].slice(-4) + ` (${contracts[0]})`
                    proxyTd = (
                      <td title={proxyAddresses[0]}>
                        <a href={`https://etherscan.io/address/${proxyAddresses[0]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser}</a>
                      </td>
                    )
                  } else if (contractRandom <= 5) {
                    contracts.push('InstaDApp')
                    proxyAddresses.push('0x939Daad09fC4A9B8f8A9352A485DAb2df4F4B3F8')
                    let shortProxyUser = contracts[0] //proxyAddresses[0].slice(0, 6) + '...' + proxyAddresses[0].slice(-4) + ` (${contracts[0]})`
                    proxyTd = (
                      <td title={proxyAddresses[0]}>
                        <a href={`https://etherscan.io/address/${proxyAddresses[0]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser}</a>
                      </td>
                    )
                  } else if (contractRandom <= 7) {
                    contracts.push('OasisDEX')
                    contracts.push('InstaDApp')
                    proxyAddresses.push('0xDAA2bB85C32a8DbdfE2858C0E41A1004F59912bA')
                    proxyAddresses.push('0x939Daad09fC4A9B8f8A9352A485DAb2df4F4B3F8')
                    let shortProxyUser = contracts[0] //proxyAddresses[0].slice(0, 6) + '...' + proxyAddresses[0].slice(-4) + ` (${contracts[0]})`
                    let shortProxyUser2 = contracts[1] //proxyAddresses[1].slice(0, 6) + '...' + proxyAddresses[1].slice(-4) + ` (${contracts[1]})`
                    proxyTd = (
                      <td>
                        <a href={`https://etherscan.io/address/${proxyAddresses[0]}`} title={`${proxyAddresses[0]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser}</a>
                        <hr />
                        <a href={`https://etherscan.io/address/${proxyAddresses[1]}`} title={`${proxyAddresses[1]}`} target="_blank" rel="noopener noreferrer">{shortProxyUser2}</a>
                      </td>
                    )
                  }

                  const balance = (<td>{this.getFakeEthBal()} Eth</td>)
                  const tokens =
                    (Math.random() < 0.5) ?
                      ( <td>0</td> ) :
                      ( <td>{Math.ceil(4*Math.random()) * Math.ceil(4*Math.random())}</td> )
                  const email = (Math.random() < 0.85) ? ( <td>No</td> ) : ( <td>Yes</td> )

                  result = (
                    <tr key={this.getUniqueKey()}>
                      <td title={user}><a href={link} target="_blank" rel="noopener noreferrer">{shortUser}</a></td>
                      {proxyTd}
                      {balance}
                      {tokens}
                      {email}
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
