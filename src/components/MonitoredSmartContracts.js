import React from "reactn";
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
    const { account, address, name, implementation_contract } = contract
    return (
      <Table.Row key={address} isSelectable onSelect={() => this.props.setImportAddress(address)}>
        <Table.Cell display="flex" alignItems="center" flexBasis={300} flexShrink={0} flexGrow={0}>
        <Avatar name={name} />
        <Text marginLeft={8} size={300} fontWeight={500}>
          {name}
        </Text>
        </Table.Cell>
        <Table.TextCell>{account}</Table.TextCell>
        <Table.TextCell isNumber>{`${address.substring(0, 10)}...`}</Table.TextCell>
        {/*<Table.Cell width={48} flex="none">
        <Popover
          content={this.renderRowMenu(address)}
          position={Position.BOTTOM_RIGHT}
        >
          <IconButton icon="more" height={24} appearance="minimal" />
        </Popover>
    </Table.Cell>*/}
      </Table.Row>
    )
  }
  render() {
    const { contractData, sessionData } = this.global
    const { monitoring } = sessionData
    // remove proxy contracts
    const pItems = contractData.filter(contract => contract.proxy_contract === null)
    // remove already imported contracts
    const fItems = pItems.filter(contract => !Object.keys(monitoring).includes(contract.address))
    const items = this.filter(fItems)
    return (
      <div>
        <Table border>
        <Table.Head>
          <Table.SearchHeaderCell
            onChange={this.handleFilterChange}
            value={this.state.searchQuery}
            placeholder='Search by company...'
            flexBasis={300} flexShrink={0} flexGrow={0}
          />
          <Table.TextCell>Company</Table.TextCell>
          <Table.TextCell>Address</Table.TextCell>
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