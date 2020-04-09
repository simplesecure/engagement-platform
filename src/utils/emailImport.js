export const importEmailArray = async (cmdObj) => {
  return new Promise(async (resolve, reject) => {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmdObj)
    }
  
    // TODO: consider timeout / abortable fetch:
    //  - https://developers.google.com/web/updates/2017/09/abortable-fetch
    //  - https://developer.mozilla.org/en-US/docs/Web/API/AbortController
    try {
      const response = await fetch(process.env.REACT_APP_WEB_API_HOST, options)
      const jsonRes = await response.json();
      console.log(jsonRes);
      resolve(jsonRes)
    } catch (error) {
      console.log(error)
      reject(error);
    }
  })
}