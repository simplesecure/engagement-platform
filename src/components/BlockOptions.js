import React from "reactn"
import { Input, Dropdown } from 'semantic-ui-react'

const options = {
  'Web2Event': [
    { key: 'authenticated', text: 'Authenticated', value: 'authenticated' },
    { key: 'open', text: 'Open CDP', value: 'open cdp' },
    { key: 'close', text: 'Close CDP', value: 'close cdp' },
    { key: 'trade', text: 'New Trade', value: 'new trade' }
  ],
  'SmartContractEvent': [
    { key: 'logtrade', text: 'Log Trade', value: 'log trade' },
    { key: 'logsortedoffer', text: 'Log Sorted Offer', value: 'log sorted offer' },
    { key: 'logitemupdate', text: 'Log Item Update', value: 'log item update' },
    { key: 'logkill', text: 'Log Kill', value: 'log kill' }
  ],
  'DatabaseAction': [
    { key: 'write', text: 'Write item to DB', value: 'write to DB' },
    { key: 'update', text: 'Update item in DB', value: 'update in DB' },
    { key: 'delete', text: 'Delete item in DB', value: 'delete in DB' }
  ],
  'NotificationAction': [
    { key: 'in-app', text: 'Send In-App Notification', value: 'in-app' },
    { key: 'push', text: 'Send Push Notification', value: 'push' }
  ],
  'EmailAction': [
    { key: '1', text: 'Welcome Template', value: 'welcome' },
    { key: '2', text: 'New Transaction Template', value: 'new' },
    { key: '3', text: 'Collect Rewards Template', value: 'collect' },
    { key: '4', text: 'Close Position Template', value: 'close' }
  ],
}

const labels = {
  'Web2Event': 'Select Web2 Property',
  'SmartContractEvent': 'Select Smart Contract Property',
  'TimeEvent': 'Input Block Delay',
  'WalletBalanceEvent': 'Input Wallet Balance Property',
  'AssetPriceEvent': 'Input Asset Price Property',
  'DatabaseAction': 'Select Database Action',
  'NotificationAction': 'Select Notification Action',
  'EmailAction': 'Select Email Action',
  'EndpointAction': 'Input Endpoint URL'
}

const placeholders = {
  'Web2Event': 'Web2 Event',
  'SmartContractEvent': 'Smart Contract Event',
  'TimeEvent': 'Delay by N Blocks',
  'WalletBalanceEvent': 'Wallet Balance',
  'AssetPriceEvent': 'Asset Price',
  'DatabaseAction': 'Database Action',
  'NotificationAction': 'Notification Action',
  'EmailAction': 'Email Action',
  'EndpointAction': 'www.endpoint.com'
}

export const setupBlockOptions = (blocks) => {
  return (
    <div>
    {
      blocks.map(block => {
        if (block === 'TimeEvent') {
          return (
            <div>
              <p class="inputlabel">{labels[block]}</p>
              <div style={{marginBottom: 15}}>
                <Input
                  label={{ basic: true, content: 'blocks' }}
                  size='large'
                  labelPosition='right'
                  placeholder={placeholders[block]}
                />
              </div>
            </div>
          )
        }
        else if (block === "WalletBalanceEvent" || block === "AssetPriceEvent") {
          return (
            <div>
              <p class="inputlabel">{labels[block]}</p>
              <div style={{marginBottom: 15}}>
                <Input
                  action={
                    <Dropdown
                      button
                      basic
                      floating
                      options={[
                        { key: 'higher', text: 'Higher', value: 'higher' },
                        { key: 'lower', text: 'Lower', value: 'lower' },
                      ]}
                      defaultValue='higher'
                    />
                  }
                  size='large'
                  placeholder={placeholders[block]}
                />
              </div>
            </div>
          )
        }
        else if (block === "EndpointAction") {
          return (
            <div>
              <p class="inputlabel">{labels[block]}</p>
              <div style={{marginBottom: 15}}>
                <Input
                  label='http://'
                  icon='globe'
                  placeholder={placeholders[block]}
                />
              </div>
            </div>
          )
        }
        else {
          return (
            <div>
              <p class="inputlabel">{labels[block]}</p>
              <div style={{marginRight: 15, marginBottom: 15}}>
                <Dropdown
                  placeholder={placeholders[block]}
                  fluid
                  selection
                  options={options[block]}
                />
              </div>
            </div>
          )
        }
      })
    }
    </div>
  )
}
