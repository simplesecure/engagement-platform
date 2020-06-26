import '../assets/css/styles.css'
import '../assets/css/flowy.css'
import { flowy } from '../assets/js/flowy.js'

export default class FlowyWorker {
  constructor () {
    this.aclick = false;
    this.noinfo = false;
    this.rightcard = false;
    this.tempblock = null;
    this.tempblock2 = null;
    this.beginTouch = this.beginTouch.bind(this)
    this.checkTouch = this.checkTouch.bind(this)
    this.doneTouch = this.doneTouch.bind(this)
    this.closeProps = this.closeProps.bind(this)
    this.drag = this.drag.bind(this)
    this.release = this.release.bind(this)
    this.snapping = this.snapping.bind(this)
    this.constructFlowy = false
  }
  setupFlowy = () => {
    if (!this.constructFlowy) {
      flowy(document.getElementById("canvas"), this.drag, this.release, this.snapping);
      this.constructFlowy = true
    }
    document.addEventListener("mousedown", this.beginTouch, false);
    document.addEventListener("mousemove", this.checkTouch, false);
    document.addEventListener("mouseup", this.doneTouch, false);
    document.getElementById("removeblock").addEventListener("click", function(){
      flowy.deleteBlocks();
    });
    document.getElementById("close").addEventListener("click", this.closeProps);
    this.addEventListenerMulti("touchstart", this.beginTouch, false, ".block");
  }
  cleanFlowy = () => {
    document.removeEventListener("mousedown", this.beginTouch);
    document.removeEventListener("mousemove", this.checkTouch);
    document.removeEventListener("mouseup", this.doneTouch);
    document.getElementById("removeblock").removeEventListener("click", function(){});
    this.remEventListenerMulti("touchstart", this.beginTouch, false, ".block");
  }
  addEventListenerMulti = (type, listener, capture, selector) => {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener(type, listener, capture);
    }
  }
  remEventListenerMulti = (type, listener, capture, selector) => {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].removeEventListener(type, listener, capture);
    }
  }
  closeProps = () => {
    if (this.rightcard) {
      this.rightcard = false;
      document.getElementById("properties").classList.remove("expanded");
      setTimeout(function(){
        document.getElementById("propwrap").classList.remove("itson");
      }, 300);
      this.tempblock.classList.remove("selectedblock");
    }
  }
  snapping = (drag, first) => {
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
  beginTouch = (event) => {
    this.aclick = true;
    this.noinfo = false;
    if (event.target.closest(".create-flowy")) {
      this.noinfo = true;
    }
  }
  checkTouch = (event) => {
    this.aclick = false;
  }
  doneTouch = (event) => {
    if (event.type === "mouseup" && this.aclick && !this.noinfo) {
      if (!this.rightcard && event.target.closest(".block") && !event.target.closest(".block").classList.contains("dragging")) {
        this.tempblock = event.target.closest(".block");
        this.rightcard = true;
        document.getElementById("properties").classList.add("expanded");
        document.getElementById("propwrap").classList.add("itson");
        this.tempblock.classList.add("selectedblock");
      }
    }
  }
  drag = (block) => {
    block.classList.add("blockdisabled");
    this.tempblock2 = block;
  }
  release = () => {
    if (this.tempblock2) {
      this.tempblock2.classList.remove("blockdisabled");
    }
  }
}