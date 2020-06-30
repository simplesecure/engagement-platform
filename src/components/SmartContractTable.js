import React from 'reactn'
import {
  Avatar,
  Table,
  Text
} from 'evergreen-ui'

export default class SmartContractTable extends React.Component {
  renderRow = ({ contract, data }) => {
    let name = contract.substring(2)
    return (
      <Table.Row key={contract} isSelectable onSelect={() => this.setState({ contractAddr: contract })}>
        <Table.Cell display="flex" alignItems="center" flexBasis={360} flexShrink={0} flexGrow={0}>
          <Avatar name={name} />
          <Text marginLeft={8} size={300} fontWeight={500}>
            {contract}
          </Text>
        </Table.Cell>
        <Table.TextCell>{data.wallets}</Table.TextCell>
      </Table.Row>
    )
  }
  render() {
    const { contracts } = this.props
    return (
      <div>
        <Table border>
          <Table.Head>
            <Table.TextCell flexBasis={360} flexShrink={0} flexGrow={0}>Smart Contract Address</Table.TextCell>
            <Table.TextCell>Number of Wallets</Table.TextCell>
          </Table.Head>
          <Table.VirtualBody height={400}>
            {Object.keys(contracts).map(item => this.renderRow({ contract: item, data: contracts[item] }))}
          </Table.VirtualBody>
        </Table>
      </div>
    )
  }
}
