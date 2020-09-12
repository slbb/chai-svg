import data from '../assets/4E00-9FA5.json'

let charMap =  new Map<string, string>()
for (let entries of Object.entries(data)) {
  let [k, v] = entries
  if (v && typeof v == 'string') {
    charMap.set(k, v)
  }
}
export default charMap
