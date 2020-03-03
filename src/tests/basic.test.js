const puppeteer = require('puppeteer');
const email = "simpleid_test@mailinator.com";
const password = "1234!Heyo";
let browser;
let page;

async function launchBrowser() {
  browser = await puppeteer.launch();
  //  Use headless: false to see the test run in a browser controlled by the test suite
  //  browser = await puppeteer.launch({headless: false});
  page = await browser.newPage();
  await page.goto('http://localhost:3000');
}

describe("end-to-end testing", () => {
  let skipOther = false
  test('Sign in page displayed', async () => {
    await launchBrowser()
    const selector = '.sign-in-modal'
    try {
      const signInScreen = await page.waitForSelector(selector);
      expect(signInScreen).toBeTruthy();
    } catch(e) {
      console.log(e)
      skipOther = true
    }
  }, 30000);

  test("might be skipped", async () => {
    if(skipOther) throw new Error("error occured in previous tests.")
    console.log("display this, if there is no error before this.")
  });

  test('Sign in successful', async () => {
    const emailEl = '#formBasicEmail'
    const passwordEl = '#formPassword'
    await page.focus(emailEl)
    await page.keyboard.type(email)
    await page.focus(passwordEl)
    await page.keyboard.type(password)
    await page.evaluate(() => document.querySelector('#submit-sign-in').scrollIntoView());
    await page.click('#submit-sign-in');
    const logo = '#main-logo';
    try {
      const signedInView = await page.waitForSelector(logo);
      expect(signedInView).toBeTruthy();
    } catch(e) {
      console.log(e)
      skipOther = true
    }
  
    await browser.close();
  }, 50000);
})