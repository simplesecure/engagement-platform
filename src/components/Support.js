import React, {setGlobal} from 'reactn'
import StickyNav from './StickyNav'
import Table from 'react-bootstrap/Table'
import Card from 'react-bootstrap/Card'
import Web3Connect from "web3connect"
import WalletConnectProvider from "@walletconnect/web3-provider"
import Portis from '@portis/web3'
import Fortmatic from 'fortmatic'
import { setLocalStorage } from '../utils/misc'
const PROFILE_STORAGE = 'engagement-app-profile'
const Web3 = require('web3')
const Box = require('3box')
let web3 = new Web3(Web3.givenProvider) 

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: 'b8c67a1f996e4d5493d5ba3ae3abfb03'
    }
  },
  portis: {
    package: Portis,
    options: {
      id: "80389521-9f08-4ded-bea3-09795dbb2201"
    }
  },
  fortmatic: {
    package: Fortmatic,
    options: {
      key: 'pk_test_AC1725A313402AC6'
    }
  }
}

export default class Support extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      threeBoxConversations: [],
      showSignIn: false, 
      conversationSelected: {}
    }
  }
  
  async componentDidMount() {
    const { space, box, sessionData } = this.global
    const { currentSegments } = sessionData
    if(web3 && web3.eth && web3.eth.getAccounts()) {
      console.log("Good to go")
      if(Object.keys(box).length > 0 && Object.keys(space).length > 0) {
        console.log("Found a space and a box")
      } else {
        console.log("connect box & space")
        const accounts = await web3.eth.getAccounts()
        const box = await Box.openBox(accounts[0], web3.currentProvider)
        const space = await box.openSpace('simpleid')
        setGlobal({ box, space })
        console.log("box and space have been opened")
        try {
          const allUsersSegment = currentSegments.filter(seg => seg.name === "All Users")[0]
          const users = allUsersSegment.users
          console.log(users)
          this.joinThreads(users)
        } catch(e) {
          console.log(e)
        }
      }
    } else {
      console.log("Sign in with a web3 wallet")
      this.setState({ showSignIn: true })
    }
  }

  joinThreads = async (users) => {
    const { space } = this.global
    const { threeBoxConversations } = this.state
    for (const user of users) {
      try {
        const thread = await space.joinThread(`test-1-${user}`)
        const threadAddress = thread.address
        console.log(threadAddress)
        const threeBoxConversationsData = {
          threadAddress, 
          addr: user
        }
        threeBoxConversations.push(threeBoxConversationsData)
      } catch (e) {
        console.log(e)
      }
    }
    this.setState({ threeBoxConversations })
  }

  connectWallet = async () => {
    const web3Connect = new Web3Connect.Core({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      providerOptions // required
    });
    let accounts = undefined
    web3Connect.toggleModal();
    web3Connect.on('connect', async (provider) => {
      web3 = await new Web3(provider)
      accounts = await web3.eth.getAccounts()
      const box = await Box.openBox(accounts[0], web3.currentProvider)
      const space = box.openSpace('simpleid')
      console.log("box and space have been opened")
      setGlobal({ provider, box, space, showSignIn: false })
      if(accounts && accounts.length > 0) {
        const msgParams = [
          {
            type: 'string',      // Any valid solidity type
            name: 'Message',     // Any string label you want
            value: 'This application is trying to access your 3Box profile data.'  // The value to sign
         }
        ] 
        web3.currentProvider.sendAsync({
          method: 'eth_signTypedData',
          params: [msgParams, accounts[0]],
          from: accounts[0],
        }, async (err, result) => {
          if (err) return console.error(err)
          if (result.error) {
            return console.error(result.error.message)
          } else {
            const profile = await Box.getProfile(accounts[0])
            profile.address = accounts[0]
            if(profile && profile.image) {
              const profileImage = profile.image[0].contentUrl
              if(profileImage) {
                const profileImageHash = Object.values(profileImage)[0]
                const fetchImageUrl = `https://gateway.ipfs.io/ipfs/${profileImageHash}`
                profile.imageUrl = fetchImageUrl
              }
            }
            console.log(profile)
            setGlobal({ threeBoxProfile: profile })
            setLocalStorage(PROFILE_STORAGE, JSON.stringify(profile));
          }
        })
      } else {
        console.log("Web3 provider error")
      }
    })
  }

  setConversation = async (conversation) => {
    this.setState({ conversationSelected: conversation })
  }

  renderConversationsOrWalletConnect() {
    const { showSignIn, threeBoxConversations } = this.state
    if(showSignIn) {
      return (
        <div>
          <button onClick={this.connectWallet} type="button" className="mb-2 btn btn-sm btn-pill btn-outline-primary mr-2"><i className="material-icons mr-1">person_add</i>Connect Wallet</button>
        </div>
      )
    } else {
      return (
        <div>
          <p>Click to open a conversation</p>
        <Card>
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Date</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
              {
                threeBoxConversations.map((convo) => {
                  return (
                    <tr key={convo.threadAddress}>
                      <td><button onClick={() => this.setConversation(convo)} className="a-el-fix">{convo.addr}</button></td>
                      <td>{convo.date}</td>
                      <td>{convo.active}</td>
                    </tr>
                  )
                })
              }
              </tbody>
            </Table>
            </Card.Body>
          </Card>
        </div>
      )
    }
  }

  render() {
    return (
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />
        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Support</span>
              <h3 className="page-title">Real-Time Messaging</h3>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 mb-4">
              <h5>Support Conversations</h5>
              
              {this.renderConversationsOrWalletConnect()}
              
              
              </div>
          </div>
        </div>
      </main>
    )

  }
}