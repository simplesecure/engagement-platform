// worker.js
export default () => { 
  self.onmessage = async function(e) { // eslint-disable-line no-restricted-globals
    const payload = JSON.parse(e.data)
    const { app_id, currentSegments } = payload

    const updatedSegments = []
    let saveToDb = false

    for(const seg of currentSegments) {
      seg['appId'] = app_id

      const cmdObj = {
        command: 'segment',
        data: seg
      }
      const results = await self.__issueWebApiCmd(cmdObj) // eslint-disable-line no-restricted-globals

      if (seg && !seg.userCount) {
        seg.userCount = 0
      }
      if ( results &&
           results.data &&
           results.data.length > seg.userCount) {
        seg.users = results.data
        seg.userCount = results.data.length
        saveToDb = true
        updatedSegments.push(seg)
      } else {
        updatedSegments.push(seg)
      }
    }
    const returnedPayload = {
      saveToDb,
      updatedSegments
    }

    self.postMessage(JSON.stringify(returnedPayload)) // eslint-disable-line no-restricted-globals
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
