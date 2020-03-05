export default function worker(self) {
  self.onmessage = async (e) => { // eslint-disable-line no-restricted-globals
    const cmdObj = JSON.parse(e.data)
    const results = await self.__issueWebApiCmd(cmdObj) // eslint-disable-line no-restricted-globals
    console.log("RESULTS: ", results)
    self.postMessage(JSON.stringify(results)) // eslint-disable-line no-restricted-globals
  }

  self.__issueWebApiCmd = async (cmdObj) => { // eslint-disable-line no-restricted-globals

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cmdObj)
    }
  
    // TODO: consider timeout / abortable fetch:
    //  - https://developers.google.com/web/updates/2017/09/abortable-fetch
    //  - https://developer.mozilla.org/en-US/docs/Web/API/AbortController
    //
    try {
      const response = await fetch(process.env.REACT_APP_WEB_API_HOST, options)
      return await response.json()
      // result = await retry(async bail => {
      //   // If anything throws in this block, we retry ...
      //   const response = await fetch(process.env.REACT_APP_WEB_API_HOST, options)
  
      //   // Some conditions don't make sense to retry, so exit ...
      //   if (response.status >= 400 && response.status <= 499) {
      //     bail(`__issueWebApiCmd failed with client error ${response.status} (${response.statusText})`)
      //     return
      //   }
      //   return await response.json()
      // }, {
      //   retries: 0,     // For now, let's not retry (long jobs & related complications)
      //   minTimeout: 500,
      //   maxTimeout: 5000,
      //   onRetry: (error) => {log.warn(`Fetch attempt failed with error below. Retrying.\n${error}`)}
      // })
    } catch (error) {
      //log.debug(`in __issueWebApiCmd try/catch, error =\n${error}`)
      //result.error = error
      console.log(error)
    }
  
    //return result
  }
}

// let code = workercode.toString()
// code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"))

// const blob = new Blob([code], {type: "application/javascript"})
// const worker_script = URL.createObjectURL(blob)

// module.exports = worker_script;