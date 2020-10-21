import React from "reactn";
import { filter } from 'fuzzaldrin-plus'
import {
  Table,
  Menu,
  Avatar,
  Text
} from 'evergreen-ui'
import {
  Dimmer,
  Loader,
} from 'semantic-ui-react'

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
    const { contractData, sessionData, currentAppId } = this.global
    const { monitoring } = sessionData
    const { isLoading } = this.props
    // remove proxy contracts
    const pItems = contractData.filter(contract => contract.proxy_contract === null)
    let iItems
    if (currentAppId === '8d7312fa-5731-467b-bdd1-d18e5f84776a') {
      iItems = pItems
    } else {
      iItems = pItems.filter(contract => contract.is_active === true)
    }
    // remove already imported contracts
    const fItems = iItems.filter(contract => !Object.keys(monitoring).includes(contract.address))
    // remove contracts from a different company
    let items
    let companyName
    if (0) {
      items = this.filter(iItems)
    }
    else if (monitoring && Object.keys(monitoring)[0]) {
      const idx = Object.keys(contractData).find(key => Object.keys(monitoring)[0] === contractData[key].address)
      companyName = contractData[idx].account
      const cItems = fItems.filter(contract => contract.account === companyName)
      items = this.filter(cItems)
    }
    else {
      items = this.filter(fItems)
    }
    if (items.length) {
      return (
        <div>
          <Table border>
          <Dimmer active={isLoading} inverted>
            <Loader active={isLoading} inverted>Importing contract...</Loader>
          </Dimmer>
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
    else {
      return (
        <div>
          There are no more contracts that match the account{" "}
          <strong>
            <u>{companyName}</u>
          </strong>
          . If you'd like to monitor other contracts, you will need to delete existing monitored contracts.
        </div>
      )
    }
  }
}