document.addEventListener("DOMContentLoaded", function(){
    var rightcard = false;
    var tempblock;
    var tempblock2;
    flowy(document.getElementById("canvas"), drag, release, snapping);
    function addEventListenerMulti(type, listener, capture, selector) {
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].addEventListener(type, listener, capture);
        }
    }
    function snapping(drag, first) {
        var grab = drag.querySelector(".grabme");
        grab.parentNode.removeChild(grab);
        var blockin = drag.querySelector(".blockin");
        blockin.parentNode.removeChild(blockin);
        if (drag.querySelector(".blockelemtype").value == "1") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/eyeblue.svg'><p class='blockyname'>Web2 Event</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Last time <span>wallet interacted</span> with <span>app</span></div>";
        } else if (drag.querySelector(".blockelemtype").value == "2") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/actionblue.svg'><p class='blockyname'>Smart Contract Event</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>ABI</span> event occurs</div>";
        } else if (drag.querySelector(".blockelemtype").value == "3") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/timeblue.svg'><p class='blockyname'>Timed Event</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>10 seconds</span> have passed</div>";
        } else if (drag.querySelector(".blockelemtype").value == "4") {
            drag.innerHTML += "<div class='blockyleft'><img width='24px' src='assets/walletblue.png'><p class='blockyname'>Wallet Balance</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>User's wallet <span>balance</span> is <span> higher </span> than <span> amount</span>.</div>";
        } else if (drag.querySelector(".blockelemtype").value == "5") {
            drag.innerHTML += "<div class='blockyleft'><img width='24px' src='assets/ethereumblue.svg'><p class='blockyname'>Asset Price</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'><span>Asset</span> price is <span> higher </span> than <span> amount</span>.</div>";
        } else if (drag.querySelector(".blockelemtype").value == "6") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/databaseorange.svg'><p class='blockyname'>Database Entry</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add <span>Data object</span> to <span>Database 1</span></div>";
        } else if (drag.querySelector(".blockelemtype").value == "7") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/internetorange.png' width='24px'><p class='blockyname'>Connect Endpoint</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Specify <span> webhook </span> endpoint</div>";
        } else if (drag.querySelector(".blockelemtype").value == "8") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/notificationorange.png' width='24px'><p class='blockyname'>Send Notification</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Notify for <span>Action 1</span></div>";
        } else if (drag.querySelector(".blockelemtype").value == "9") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/mailorange.png' width='24px'><p class='blockyname'>Send Email</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Email <span>Query 1</span> with the account <span>email</span></div>";
        } else if (drag.querySelector(".blockelemtype").value == "10") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/logred.svg'><p class='blockyname'>And Block</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add <span>and</span> logic block</div>";
        } else if (drag.querySelector(".blockelemtype").value == "11") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/logred.svg'><p class='blockyname'>Or Block</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add <span>or</span> logic block</div>";
        } else if (drag.querySelector(".blockelemtype").value == "12") {
            drag.innerHTML += "<div class='blockyleft'><img src='assets/errorred.svg'><p class='blockyname'>Priority Block</p></div><div class='blockyright'><img src='assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add <span>priority</span> block</div>";
        }
        return true;
    }
    function drag(block) {
        block.classList.add("blockdisabled");
        tempblock2 = block;
    }
    function release() {
        if (tempblock2) {
            tempblock2.classList.remove("blockdisabled");
        }
    }
    var disabledClick = function(){
        document.querySelector(".navactive").classList.add("navdisabled");
        document.querySelector(".navactive").classList.remove("navactive");
        this.classList.add("navactive");
        this.classList.remove("navdisabled");
        if (this.getAttribute("id") == "triggers") {
            document.getElementById("blocklist").innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="1"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/eye.svg"></div><div class="blocktext">                        <p class="blocktitle">Web2 Event</p><p class="blockdesc">Triggers when user interacts with your application</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="2"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext">                        <p class="blocktitle">Smart Contract Event</p><p class="blockdesc">Triggers when specified ABI event happens on chain</p></div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="3"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/time.svg"></div><div class="blocktext">                        <p class="blocktitle">Timed Event</p><p class="blockdesc">Triggers after a specified amount of time</p>          </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="4"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img width="24px" src="assets/wallet.png"></div><div class="blocktext">                        <p class="blocktitle">Wallet Balance</p><p class="blockdesc">Triggers if wallet balance is in specified range</p>              </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="5"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img width="24px" src="assets/ethereum.svg"></div><div class="blocktext">                        <p class="blocktitle">Asset Price</p><p class="blockdesc">Triggers if asset reaches specified price</p>              </div></div></div>';
        } else if (this.getAttribute("id") == "actions") {
            document.getElementById("blocklist").innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="7"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/internet.png" width="20px"></div><div class="blocktext">                        <p class="blocktitle">Connect Endpoint</p><p class="blockdesc">Specify endpoint to send notification to</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="8"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/notification.png" width="20px"></div><div class="blocktext">                        <p class="blocktitle">Send Notification</p><p class="blockdesc">Sends a notification for specified action</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="9"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/mail.png" width="20px"></div><div class="blocktext">                        <p class="blocktitle">Send Email</p><p class="blockdesc">Sends an email for a specified action</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="6"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/database.svg"></div><div class="blocktext">                        <p class="blocktitle">Database Entry</p><p class="blockdesc">Adds a new entry to a specified database</p>        </div></div></div>';
        } else if (this.getAttribute("id") == "logic") {
            document.getElementById("blocklist").innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="10"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/log.svg"></div><div class="blocktext">                        <p class="blocktitle">And Block</p><p class="blockdesc">Set <span> and </span> logic block</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="11"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/log.svg"></div><div class="blocktext">                        <p class="blocktitle">Or Block</p><p class="blockdesc">Set <span> or </span> logic block</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="12"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/error.svg"></div><div class="blocktext">                        <p class="blocktitle">Priority Block</p><p class="blockdesc">Set <span> priority </span> of logic</p>        </div></div></div>';
        }
    }
    addEventListenerMulti("click", disabledClick, false, ".side");
    document.getElementById("close").addEventListener("click", function(){
       if (rightcard) {
           rightcard = false;
           document.getElementById("properties").classList.remove("expanded");
           setTimeout(function(){
                document.getElementById("propwrap").classList.remove("itson");
           }, 300);
            tempblock.classList.remove("selectedblock");
       }
    });

document.getElementById("rightswitch").addEventListener("click", function(){
  // As a JSON string
  const output = flowy.output()
  if (output) {
    console.log('JSON Blocks', JSON.stringify(output))
    // document.getElementById("canvas").style.backgroundColor = "yellow";
    // document.getElementById("canvas").innerHTML = output
  }
});

document.getElementById("removeblock").addEventListener("click", function(){
 flowy.deleteBlocks();
});
var aclick = false;
var noinfo = false;
var beginTouch = function (event) {
    aclick = true;
    noinfo = false;
    if (event.target.closest(".create-flowy")) {
        noinfo = true;
    }
}
var checkTouch = function (event) {
    aclick = false;
}
var doneTouch = function (event) {
    if (event.type === "mouseup" && aclick && !noinfo) {
      if (!rightcard && event.target.closest(".block") && !event.target.closest(".block").classList.contains("dragging")) {
            tempblock = event.target.closest(".block");
            rightcard = true;
            document.getElementById("properties").classList.add("expanded");
            document.getElementById("propwrap").classList.add("itson");
            tempblock.classList.add("selectedblock");
       }
    }
}
addEventListener("mousedown", beginTouch, false);
addEventListener("mousemove", checkTouch, false);
addEventListener("mouseup", doneTouch, false);
addEventListenerMulti("touchstart", beginTouch, false, ".block");
});