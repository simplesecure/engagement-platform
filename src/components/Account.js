import React, { setGlobal } from 'reactn'
import StickyNav from './StickyNav'
import Web3Connect from "web3connect"
import WalletConnectProvider from "@walletconnect/web3-provider"
import Portis from '@portis/web3'
import Fortmatic from 'fortmatic'
import { setLocalStorage } from '../utils/misc'
const PROFILE_STORAGE = 'engagement-app-profile'

const Web3 = require('web3')
// const Box = require('3box')
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

export default class Account extends React.Component {

  async componentDidMount() {
    // const accounts = await web3.eth.getAccounts()
    // const profile = await Box.getProfile(accounts[0])
    // profile.address = accounts[0]
    // if(profile && profile.image) {
    //   const profileImage = profile.image[0].contentUrl
    //   if(profileImage) {
    //     const profileImageHash = Object.values(profileImage)[0]
    //     const fetchImageUrl = `https://gateway.ipfs.io/ipfs/${profileImageHash}`
    //     profile.imageUrl = fetchImageUrl
    //   }
    // }
    //
    // setGlobal({ threeBoxProfile: profile })
    // setLocalStorage(PROFILE_STORAGE, JSON.stringify(profile));
  }

  // disconnect3Box = () => {
  //   const WEB3_CONNECT = 'WEB3_CONNECT_CACHED_PROVIDER'
  //   const ENGAGEMENT_PROFILE = 'engagement-app-profile'
  //   localStorage.removeItem(WEB3_CONNECT)
  //   localStorage.removeItem(ENGAGEMENT_PROFILE)
  //   setGlobal({ threeBoxProfile: {} })
  // }
  //
  // connect3Box = async() => {
  //   const web3Connect = new Web3Connect.Core({
  //     network: "mainnet", // optional
  //     cacheProvider: true, // optional
  //     providerOptions // required
  //   });
  //   let accounts = undefined
  //   web3Connect.toggleModal();
  //   web3Connect.on('connect', async (provider) => {
  //     web3 = await new Web3(provider)
  //     setGlobal({ web3 })
  //     accounts = await web3.eth.getAccounts()
  //     setGlobal({ provider })
  //     if(accounts && accounts.length > 0) {
  //       const msgParams = [
  //         {
  //           type: 'string',      // Any valid solidity type
  //           name: 'Message',     // Any string label you want
  //           value: 'This application is trying to access your 3Box profile data.'  // The value to sign
  //        }
  //       ]
  //       web3.currentProvider.sendAsync({
  //         method: 'eth_signTypedData',
  //         params: [msgParams, accounts[0]],
  //         from: accounts[0],
  //       }, async (err, result) => {
  //         if (err) return console.error(err)
  //         if (result.error) {
  //           return console.error(result.error.message)
  //         } else {
  //           const profile = await Box.getProfile(accounts[0])
  //           profile.address = accounts[0]
  //           if(profile && profile.image) {
  //             const profileImage = profile.image[0].contentUrl
  //             if(profileImage) {
  //               const profileImageHash = Object.values(profileImage)[0]
  //               const fetchImageUrl = `https://gateway.ipfs.io/ipfs/${profileImageHash}`
  //               profile.imageUrl = fetchImageUrl
  //             }
  //           }
  //           console.log(profile)
  //           setGlobal({ threeBoxProfile: profile })
  //           setLocalStorage(PROFILE_STORAGE, JSON.stringify(profile));
  //         }
  //       })
  //     } else {
  //       console.log("Web3 provider error")
  //     }
  //   })
  // }

  render() {
    const { threeBoxProfile } = this.global
    const imageUrl = threeBoxProfile && threeBoxProfile.imageUrl ? threeBoxProfile.imageUrl : undefined
    const name = threeBoxProfile && threeBoxProfile.name ? threeBoxProfile.name : "Anonymous Human"
    const description = threeBoxProfile && threeBoxProfile.description ? threeBoxProfile.description : "You're awesome and people like you"
    return(
      <main className="main-content col-lg-10 col-md-9 col-sm-12 p-0 offset-lg-2 offset-md-3">
        <StickyNav />

        <div className="main-content-container container-fluid px-4">
          <div className="page-header row no-gutters py-4">
            <div className="col-12 col-sm-4 text-center text-sm-left mb-0">
              <span className="text-uppercase page-subtitle">Overview</span>
              <h3 className="page-title">Account Information</h3>
            </div>
          </div>
          <div className="row">
            {/*<div className="col-lg-4">
              <div className="card card-small mb-4 pt-3">
                <div className="card-header border-bottom text-center">
                  <div className="mb-3 mx-auto">
                    {
                      imageUrl ?
                      <img className="rounded-circle" src={imageUrl} alt="User Avatar" width="110" /> :
                      <img className="rounded-circle" src={require('../assets/img/dog_avatar.png')} alt="User Avatar" width="110" />
                    }
                  </div>
                  <h4 className="mb-0">{name}</h4>
                  <span className="text-muted d-block mb-2">{description}</span>
                    {
                      !threeBoxProfile.address ?
                      <button onClick={this.connect3Box} type="button" className="mb-2 btn btn-sm btn-pill btn-outline-primary mr-2"><i className="material-icons mr-1">person_add</i>Connect 3Box</button> :
                      <button onClick={this.disconnect3Box} type="button" className="mb-2 btn btn-sm btn-pill btn-outline-primary mr-2"><i className="material-icons mr-1">person_remove</i>Disconnect 3Box</button>
                    }
                    <div><p>Want to update your 3Box profile? <a href="https://3box.io/hub" target="_blank" rel="noreferrer noopener">Do it here.</a></p></div>
                </div>

              </div>
            </div>*/}
            <div className="col-lg-8">
              <div className="card card-small mb-4">
                <div className="card-header border-bottom">
                  <h6 className="m-0">Billing Information</h6>
                  <p>You're currently in Beta. When the Beta release is over, we will contact you.</p>
                </div>
                {/*<ul className="list-group list-group-flush">
                  <li className="list-group-item p-3">
                    <div className="row">
                      <div className="col">
                        <form>
                          <div className="form-row">
                            <div className="form-group col-md-6">
                              <label htmlFor="feFirstName">First Name</label>
                              <input type="text" className="form-control" id="feFirstName" placeholder="First Name" value="Sierra" /> </div>
                            <div className="form-group col-md-6">
                              <label htmlFor="feLastName">Last Name</label>
                              <input type="text" className="form-control" id="feLastName" placeholder="Last Name" value="Brooks" /> </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group col-md-6">
                              <label htmlFor="feEmailAddress">Email</label>
                              <input type="email" className="form-control" id="feEmailAddress" placeholder="Email" value="sierra@example.com" /> </div>
                            <div className="form-group col-md-6">
                              <label htmlFor="fePassword">Password</label>
                              <input type="password" className="form-control" id="fePassword" placeholder="Password" /> </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="feInputAddress">Address</label>
                            <input type="text" className="form-control" id="feInputAddress" placeholder="1234 Main St" /> </div>
                          <div className="form-row">
                            <div className="form-group col-md-6">
                              <label htmlFor="feInputCity">City</label>
                              <input type="text" className="form-control" id="feInputCity" /> </div>
                            <div className="form-group col-md-4">
                              <label htmlFor="feInputState">State</label>
                              <select id="feInputState" className="form-control">
                                <option selected>Choose...</option>
                                <option>...</option>
                              </select>
                            </div>
                            <div className="form-group col-md-2">
                              <label htmlFor="inputZip">Zip</label>
                              <input type="text" className="form-control" id="inputZip" /> </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group col-md-12">
                              <label htmlFor="feDescription">Description</label>
                              <textarea className="form-control" name="feDescription" rows="5">Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio eaque, quidem, commodi soluta qui quae minima obcaecati quod dolorum sint alias, possimus illum assumenda eligendi cumque?</textarea>
                            </div>
                          </div>
                          <button type="submit" className="btn btn-accent">Update Account</button>
                        </form>
                      </div>
                    </div>
                  </li>
                </ul>*/}
              </div>
            </div>
            </div>
            </div>
      </main>
    )
  }
}
