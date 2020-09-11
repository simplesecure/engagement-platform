import React from 'reactn'
import { filter } from 'fuzzaldrin-plus'
import {
  Avatar,
  Table,
  Text,
  Menu
} from 'evergreen-ui'
import UserWallet from "./UserWallet";

export default class SegmentTable extends React.Component {
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
  renderRowMenu = (user) => {
    let link = `https://etherscan.io/address/` + user
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
  renderRow = ({ user }) => {
    let name = user.substring(2)
    return (
      <Table.Row key={user} isSelectable onSelect={() => this.setState({ showDialog: true, walletAddr: user })}>
        <Table.Cell display="flex" alignItems="center" flexBasis={360} flexShrink={0} flexGrow={0}>
          <Avatar name={name} />
          <Text marginLeft={8} size={300} fontWeight={500}>
            {user}
          </Text>
        </Table.Cell>
        {/*<Table.TextCell>{wallet}</Table.TextCell>*/}
        {/*<Table.TextCell isNumber>Pending...</Table.TextCell>
        <Table.Cell width={48} flex="none">
          <Popover
            content={this.renderRowMenu(user)}
            position={Position.BOTTOM_RIGHT}
          >
            <IconButton icon="more" height={24} appearance="minimal" />
          </Popover>
        </Table.Cell>*/}
      </Table.Row>
    )
  }
  toggleDialog = () => {
    this.setState({showDialog: !this.state.showDialog})
  }
  render() {
    const { segment } = this.props
    const { showDialog, walletAddr, walletType } = this.state
    let users = segment.users ? segment.users : []
    const items = this.filter(users)
    return (
      <div>
        <Table border>
          <Table.Head>
            <Table.SearchHeaderCell
              onChange={this.handleFilterChange}
              value={this.state.searchQuery}
              placeholder='Search by wallet...'
              flexBasis={360} flexShrink={0} flexGrow={0}
            />
            {/*<Table.TextCell>Wallet Proxy</Table.TextCell>*/}
            {/*<Table.TextCell>Proxy Wallet</Table.TextCell>
            <Table.HeaderCell width={48} flex="none" />*/}
          </Table.Head>
          <Table.VirtualBody height={400}>
            {items.map(item => this.renderRow({ user: item }))}
          </Table.VirtualBody>
        </Table>
        <UserWallet
          showDialog={showDialog}
          walletAddr={walletAddr}
          walletType={walletType}
          toggleDialog={() => this.toggleDialog()}
        />
      </div>
    )
  }
}
