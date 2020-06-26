import React from 'react';

export const TriggerBlocks = () => {
  return (
    <div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="1" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/eye.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Web2 Event
            </p>
            <p className="blockdesc">
              Triggers when user interacts with your application
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="2" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/action.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Smart Contract Event
            </p>
            <p className="blockdesc">
              Triggers when specified ABI event happens on chain
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="3" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/time.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Timed Event
            </p>
            <p className="blockdesc">
              Triggers after a specified amount of time
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="4" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img width="24px" src={require("../assets/img/wallet.png")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Wallet Balance
            </p>
            <p className="blockdesc">
              Triggers if wallet balance is in specified range
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="5" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img width="24px" src={require("../assets/img/ethereum.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Asset Price
            </p>
            <p className="blockdesc">
              Triggers if asset reaches specified price
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ActionBlocks = () => {
  return (
    <div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="7" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/internet.png")} width="20px" />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Connect Endpoint
            </p>
            <p className="blockdesc">
              Specify endpoint to send notification to
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="8" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/notification.png")} width="20px" />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Send Notification
            </p>
            <p className="blockdesc">
              Sends a notification for specified action
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="9" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/mail.png")} width="20px" />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Send Email
            </p>
            <p className="blockdesc">
              Sends an email for a specified action
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="6" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/database.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Database Entry
            </p>
            <p className="blockdesc">
              Adds a new entry to a specified database
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const LogicBlocks = () => {
  return (
    <div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="10" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/log.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              And Block
            </p>
            <p className="blockdesc">
              Set <span> and </span> logic block
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="11" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/log.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Or Block
            </p>
            <p className="blockdesc">
              Set <span> or </span> logic block
            </p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="12" />
        <div className="grabme">
          <img src={require("../assets/img/grabme.svg")} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={require("../assets/img/error.svg")} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">
              Priority Block
            </p>
            <p className="blockdesc">
              Set <span> priority </span> of logic
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
