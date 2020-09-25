import React from 'reactn'
import {
  Avatar,
  Table,
  Text
} from 'evergreen-ui'

export default class SmartContractTable extends React.Component {
  renderRow = ({ key, value }) => {
    const { latest_block_id, wallet_count, recent_wallets, contract_name } = value
    return (
      <Table.Row key={key} isSelectable onSelect={() => {
        this.props.setCurrentContract(key)
        this.props.onCloseComplete()
      }}>
        <Table.Cell display="flex" alignItems="center" flexBasis={300} flexShrink={0} flexGrow={0}>
          <Avatar name={contract_name} />
          <Text marginLeft={8} size={300} fontWeight={500}>
            {contract_name}
          </Text>
        </Table.Cell>
        <Table.TextCell isNumber>{wallet_count}</Table.TextCell>
        <Table.TextCell isNumber>{latest_block_id}</Table.TextCell>
      </Table.Row>
    )
  }
  render() {
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
            {Object.entries(contracts).map(([key,value]) => this.renderRow({ key, value }))}
          </Table.VirtualBody>
        </Table>
      </div>
    )
  }
}
