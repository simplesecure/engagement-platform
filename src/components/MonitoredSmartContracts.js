import React from 'react'
import { filter } from 'fuzzaldrin-plus'
import {
  Table,
  Menu,
  Avatar,
  Text,
  Popover,
  IconButton,
  Position
} from 'evergreen-ui'
import contracts from './contracts.json'

export default class MonitoredSmartContracts extends React.Component {
  constructor() {
    super()
    this.keyIdx=0
    this.state = {
    searchQuery: '',
    showDialog: false,
    walletAddr: ''
    }
  }
  getUniqueKey() {
    return `DemoTable${this.keyIdx++}`
  }
  // Filter the users based on the name property.
  filter = contracts => {
    const searchQuery = this.state.searchQuery.trim()
    // If the searchQuery is empty, return the users as is.
    if (searchQuery.length === 0) return contracts
    return contracts.filter(contract => {
    // Use the filter from fuzzaldrin-plus to filter by name.
    const result = filter([contract.account], searchQuery)
    return result.length === 1
    })
  }
  handleFilterChange = value => {
    this.setState({ searchQuery: value })
  }
  renderRowMenu = (address) => {
    let link = `https://etherscan.io/address/` + address
    return (
    <Menu>
      <Menu.Group>
      {/* <Menu.Item>Insights...</Menu.Item> */}
      <Menu.Item><a href={link} target="_blank" rel="noopener noreferrer">Etherscan...</a></Menu.Item>
      </Menu.Group>
      {/* <Menu.Divider />
      <Menu.Group>
      <Menu.Item intent="danger">Delete...</Menu.Item>
      </Menu.Group> */}
    </Menu>
    )
  }
  renderRow = ({ contract }) => {
    return (
    <Table.Row key={contract.address} isSelectable onSelect={() => this.props.setImportAddress(contract.address)}>
      <Table.Cell display="flex" alignItems="center" flexBasis={360} flexShrink={0} flexGrow={0}>
      <Avatar name={contract.name} />
      <Text marginLeft={8} size={300} fontWeight={500}>
        {contract.name}
      </Text>
      </Table.Cell>
      <Table.TextCell>{contract.account}</Table.TextCell>
      <Table.Cell width={48} flex="none">
      <Popover
        content={this.renderRowMenu(contract.address)}
        position={Position.BOTTOM_RIGHT}
      >
        <IconButton icon="more" height={24} appearance="minimal" />
      </Popover>
      </Table.Cell>
    </Table.Row>
    )
  }
  render() {
    const items = this.filter(contracts)
    return (
      <div>
        <Table border>
        <Table.Head>
          <Table.SearchHeaderCell
            onChange={this.handleFilterChange}
            value={this.state.searchQuery}
            placeholder='Search by company...'
            flexBasis={360} flexShrink={0} flexGrow={0}
          />
          <Table.TextCell>Company</Table.TextCell>
          {/*<Table.TextCell>More</Table.TextCell>
          <Table.HeaderCell width={48} flex="none" />*/}
        </Table.Head>
        <Table.VirtualBody height={400}>
          {items.map(item => this.renderRow({ contract: item }))}
        </Table.VirtualBody>
        </Table>
      </div>
    )
  }
}