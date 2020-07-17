const eccrypto = require('eccrypto')

// !!! WARNING !!! Specifically for Browser--not Node.js
//
// Converts any array type to a Buffer if required.
//
function toBuffer(anArray) {
  const method = 'misc.js::toBuffer'

  if (typeof anArray !== 'object') {
    throw new Error(`${method}: Argument 'anArray' must be an object.`)
  }

  switch (anArray.constructor) {
    case Buffer:
      return anArray
      break
    
    case Array:
    case Uint8Array:
    case Uint16Array:
    case Uint32Array:
    case Int8Array:
    case Int16Array:
    case Int32Array:
    case ArrayBuffer:
      return Buffer.from(anArray)
      break

    default:
      throw new Error(`${method} Unable to convert 'anArray' to Uint8Array--unsupported type.`)
  }
}

/**
 * Wrapping eccrypto.decrypt here to ensure correct types.
 * 
 * The library checks the arguments with an isBuffer call. This fails for the cipher object when 
 * it is restored from Dynamo etc. as an ArrayBuffer.
 * 
 * @param {*} aPrivateKey 
 * @param {*} aCipherObj 
 */
export async function decryptWrapper(aPrivateKey, aCipherObj) {
  if (!aPrivateKey || !aCipherObj) {
    throw new Error('misc.js::decrypt: Method arguments must be defined.')
  }

  let privateKeyBuf = toBuffer(aPrivateKey)
  let cipherBufObj = {}
  for (const key in aCipherObj) {
    cipherBufObj[key] = toBuffer(aCipherObj[key])
  }

  return await eccrypto.decrypt(privateKeyBuf, cipherBufObj)
}

/**
 * Wrapping eccrypt.encrypt here to ensure correct types.
 * 
 * Same issue as for decryptWrapper above... see note. This code only checks
 * and modifies the public key.
 * 
 * @param {*} aPublicKey
 * @param {*} aBufferToEncrypt
 */
export async function encryptWrapper(aPublicKey, aPlainTextBuffer) {
  if (!aPublicKey|| !aPlainTextBuffer) {
    throw new Error('misc.js::encrypt: Method arguments must be defined.')
  }

  let publicKeyBuf = toBuffer(aPublicKey)

  return await eccrypto.encrypt(publicKeyBuf, aPlainTextBuffer)
}

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

// TODO: move this to utils & find a better method (this has limitations
//       for classes etc)
export function deepCopy(anObjToCopy) {
  const method = 'misc::deepCopy'
  try {
    return jsonParseToBuffer(JSON.stringify(anObjToCopy))
  } catch (error) {
    throw new Error(`${method} failed to deep copy anObjToCopy.\n${error}`)
  }
}
