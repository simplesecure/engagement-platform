export function setLocalStorage(key, data) {
  let dataToStore = null;
  if(typeof data === 'string') {
    dataToStore = data;
  } else {
    dataToStore = JSON.stringify(data);
  }
  localStorage.setItem(key, dataToStore);
}