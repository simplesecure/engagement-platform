////////////////////////////////////////////////////////////////////
///     Example cmdObj for reference:            ///////////////////
///     const cmdObj = {                         ///////////////////
///       command: 'getWeb2Analytics',           ///////////////////
///       data: {                                ///////////////////
///         appId: '660928cd-3ca8-44a6-b375-6b38027fb93d',   ///////
///         event: 'eventName'   ,        //////////////////////////
///         type: 'monthly' or 'weekly'   <-- deprecated  //////////
///       }                              ///////////////////////////
///     }                                ///////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////


export const getWeb2Analytics = async (cmdObj) => {
  try {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cmdObj)
    }

    // TODO: consider timeout / abortable fetch:
    //  - https://developers.google.com/web/updates/2017/09/abortable-fetch
    //  - https://developer.mozilla.org/en-US/docs/Web/API/AbortController

    const response = await fetch(process.env.REACT_APP_WEB_API_HOST, options)
    return await response.json();
  } catch(error) {
    throw new Error(`getWeb2Analytics failed.\n${error}`)
  }
}
