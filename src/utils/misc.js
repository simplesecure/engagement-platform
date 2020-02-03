const Buffer = require('buffer/').Buffer  // note: the trailing slash is important!
                                          // (See: https://github.com/feross/buffer)

/**
 * jsonParseToBuffer:
 *
 * Notes:
 *    Adapted from: https://stackoverflow.com/questions/34557889/how-to-deserialize-a-nested-buffer-using-json-parse
 *
 * TODO:
 *        1. Refactor to common area.
 *
 */
export function jsonParseToBuffer(aStringifiedObj) {
  return JSON.parse(
    aStringifiedObj,
    (k, v) => {
      if ( v != null               &&
           typeof v === 'object'   &&
           'type' in v             &&
           v.type === 'Buffer'     &&
           'data' in v             &&
           Array.isArray(v.data) ) {
        return Buffer.from(v.data)
      }
      return v
    }
  )
}

export function setLocalStorage(key, data) {
  let dataToStore = null;
  if(typeof data === 'string') {
    dataToStore = data;
  } else {
    dataToStore = JSON.stringify(data);
  }
  localStorage.setItem(key, dataToStore);
}
