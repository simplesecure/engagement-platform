import React from 'reactn'
import {
  Avatar,
  Table,
  Text
} from 'evergreen-ui'

export default class SmartContractTable extends React.Component {
  renderRow = ({ key, value, contractData }) => {
    const contractDataKey = Object.keys(contractData).find(k => contractData[k].address === key)
    const name = contractData[contractDataKey].name
    const { latest_block_id, wallet_count, recent_wallets } = value
    // let name = contract.substring(2)
    return (
      <Table.Row key={key} isSelectable onSelect={() => this.setState({ contractAddr: key })}>
        <Table.Cell display="flex" alignItems="center" flexBasis={300} flexShrink={0} flexGrow={0}>
          <Avatar name={name} />
          <Text marginLeft={8} size={300} fontWeight={500}>
            {name}
          </Text>
        </Table.Cell>
        <Table.TextCell isNumber>{wallet_count}</Table.TextCell>
        <Table.TextCell isNumber>{latest_block_id}</Table.TextCell>
      </Table.Row>
    )
  }
  render() {
    const { contractData } = this.global;
    const { contracts } = this.props
    return (
      <div>
        <Table border>
          <Table.Head>
            <Table.TextCell flexBasis={300} flexShrink={0} flexGrow={0}>Smart Contract</Table.TextCell>
            <Table.TextCell>Number of Wallets</Table.TextCell>
            <Table.TextCell>Block Updated</Table.TextCell>
          </Table.Head>
          <Table.VirtualBody height={400}>
            {Object.entries(contracts).map(([key,value]) => this.renderRow({ key, value, contractData }))}
          </Table.VirtualBody>
        </Table>
      </div>
    )
  }
}
