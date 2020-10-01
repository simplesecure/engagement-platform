import React from 'reactn'
import { filter } from 'fuzzaldrin-plus'
import {
  Avatar,
  Table,
  Text,
  Menu,
  Popover,
  Position,
  IconButton
} from 'evergreen-ui'
import UserWallet from "./UserWallet";

export default class SegmentTable extends React.Component {
  constructor() {
    super()
    this.keyIdx=0
    this.state = {
      searchQuery: '',
      showDialog: false,
      address: '',
      hash: ''
    }
  }
  getUniqueKey() {
    return `DemoTable${this.keyIdx++}`
  }
  // Filter the users based on the name property.
  filter = users => {
    const searchQuery = this.state.searchQuery.trim()
    // If the searchQuery is empty, return the users as is.
    if (searchQuery.length === 0) return users
    return users.filter(user => {
      // Use the filter from fuzzaldrin-plus to filter by name.
      const result = filter([user], searchQuery)
      return result.length === 1
    })
  }
  handleFilterChange = value => {
    this.setState({ searchQuery: value })
  }
  renderRowMenu = (hash) => {
    let link = `https://etherscan.io/tx/` + hash
    return (
      <Menu>
        <Menu.Group>
          <Menu.Item>Insights...</Menu.Item>
          <Menu.Item><a href={link} target="_blank" rel="noopener noreferrer">Etherscan...</a></Menu.Item>
        </Menu.Group>
        <Menu.Divider />
        <Menu.Group>
          <Menu.Item intent="danger">Delete...</Menu.Item>
        </Menu.Group>
      </Menu>
    )
  }
  renderRow = ({ wallet }) => {
    const { address, block_id, block_timestamp, hash } = wallet
    let link = ''
    if (hash) {
      link = `https://etherscan.io/tx/` + hash
    } else {
      link = `https://etherscan.io/address/` + address
    }
    let name = address ? address.substring(2) : ''
    return (
      <Table.Row key={address} isSelectable onSelect={() => window.open(link, "_blank")}>
        <Table.Cell display="flex" alignItems="center" flexBasis={300} flexShrink={0} flexGrow={0}>
          <Avatar name={name} />
          <Text marginLeft={8} size={300} fontWeight={500}>
            {address}
          </Text>
        </Table.Cell>
        <Table.TextCell>{block_timestamp}</Table.TextCell>
        <Table.TextCell isNumber>{block_id}</Table.TextCell>
        {/* <Table.Cell width={48} flex="none">
          <Popover
            content={this.renderRowMenu(hash)}
            position={Position.BOTTOM_RIGHT}
          >
            <IconButton icon="more" height={24} appearance="minimal" />
          </Popover>
        </Table.Cell> */}
      </Table.Row>
    )
  }
  toggleDialog = () => {
    this.setState({showDialog: !this.state.showDialog})
  }
  render() {
    const { wallets } = this.props
    const { showDialog, address, walletType, hash } = this.state
    const items = this.filter(wallets)
    return (
      <div>
        <Table border>
          <Table.Head>
            <Table.SearchHeaderCell
              onChange={this.handleFilterChange}
              value={this.state.searchQuery}
              placeholder='Search by wallet...'
              flexBasis={300} flexShrink={0} flexGrow={0}
            />
            <Table.TextCell>Timestamp</Table.TextCell>
            <Table.TextCell>Ethereum Block</Table.TextCell>
            {/* <Table.HeaderCell width={48} flex="none" /> */}
          </Table.Head>
          <Table.VirtualBody height={400}>
            {items.map(item => this.renderRow({ wallet: item }))}
          </Table.VirtualBody>
        </Table>
        <UserWallet
          showDialog={showDialog}
          walletType={walletType}
          address={address}
          hash={hash}
          toggleDialog={() => this.toggleDialog()}
        />
      </div>
    )
  }
}
