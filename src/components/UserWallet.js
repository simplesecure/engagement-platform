import React from 'reactn';
import {
  SideSheet,
  Pane,
  Heading,
  Paragraph,
  Tab,
  Tablist,
  Avatar
} from 'evergreen-ui'
import {
  Feed,
  Segment,
  Divider
} from 'semantic-ui-react'
import uuid from 'uuid/v4'

export default class UserWallet extends React.Component {
  constructor() {
    super()
    this.state = {
      selectedIndex: 0
    }
  }
  renderFeed() {
    // const { selectedIndex, walletAddr, walletType } = this.state
    const { selectedIndex } = this.state
    let icons = []
    let dates = []
    let summaries = []
    let id = uuid()
    if (selectedIndex === 0) {
      //Identities
      icons = ['user secret', 'mail outline', 'mobile alternate']
      dates = ['UUID', 'Email Available', 'Push Notification']
      summaries = [id, 'Yes', 'No']
    }
    else if (selectedIndex === 1) {
      //Smart Contract
      icons = ['ethereum', 'cube', 'cube', 'cube']
      dates = ['480.232', '322', '78', '597']
      summaries = ['ETH', 'MKR', 'REP', 'DAI']
    }
    else if (selectedIndex === 2) {
      //Communications
      icons = ['mail outline', 'bell outline', 'star outline', 'mobile alternate']
      dates = ['E-Mails Opened', 'Push Notifications Opened', 'In-App Notifications Opened', 'SMS Notifications Opened']
      summaries = ['30%', '72%', '40%', '10%']
    }
    else if (selectedIndex === 3) {
      //Smart Contract
      icons = ['computer', 'computer', 'computer', 'computer', 'computer']
      dates = ['10m', '45m', '10h', '17h', '3d']
      summaries = ['Oasis CDP', 'Aave Flash Loan', 'Uniswap Dex', 'Atomic Loan', 'Maker Governance']
    }
    else if (selectedIndex === 4) {
      //Proxy Contract
      icons = ['fork', 'fork', 'fork']
      dates = ['10m', '45m', '10h']
      summaries = ['InstaDapp DSA', 'Augur Proxy', 'Balancer Labs']
    }
    return (
      <Feed size="large">
        {
          dates.map((d, i) => (
            <Feed.Event key={dates[i]}>
              <Feed.Label icon={icons[i]} />
              <Feed.Content
                date={dates[i]}
                summary={
                  summaries[i]
                }
              />
              <Feed.Meta>
                <Divider />
              </Feed.Meta>
            </Feed.Event>
          ))
        }
      </Feed>
    )
  }
  render() {
    const { walletAddr, walletType, showDialog, toggleDialog } = this.props
    const name = walletAddr[2] + " " + walletAddr[3]
    const shortWalletAddr = walletAddr.substring(0, 30) + "...."
    let link = 'https://etherscan.io/address/' + walletAddr
    return (
      <div className="text-center">
        <SideSheet
          isShown={showDialog}
          onCloseComplete={() => toggleDialog()}
          containerProps={{
            height: '60%',
            display: 'flex',
            flex: '1',
            flexDirection: 'column',
            marginTop: 150,
          }}
        >
          <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
            <Pane padding={16} borderBottom="muted">
              <Pane display="flex" alignItems="center">
                <Heading size={600}>
                  <a href={link} target="_blank" rel="noopener noreferrer">{shortWalletAddr}</a>
                </Heading>
                <Avatar name={name} size={40} marginLeft={16} />
              </Pane>
              <Paragraph size={500} color="muted">
                {walletType} Wallet
              </Paragraph>
            </Pane>
            <Pane display="flex" padding={8}>
              <Tablist>
                 {['Identities', 'Tokens', 'Communications', 'Smart Contracts', 'Proxy Contracts'].map(
                    (tab, index) => (
                      <Tab
                        key={tab}
                        isSelected={this.state.selectedIndex === index}
                        onSelect={() => {
                          this.setState({ selectedIndex: index })}
                        }
                      >
                        {tab}
                      </Tab>
                    )
                  )}
              </Tablist>
            </Pane>
          </Pane>
          <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
            <Segment raised padded>
              {this.renderFeed()}
            </Segment>
          </Pane>
        </SideSheet>
      </div>
    )
  }
}
