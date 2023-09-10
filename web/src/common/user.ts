import { atom } from "recoil";
import axios from 'axios'

const isDev = process.env.NODE_ENV == 'development'

type IUser = {
  name: string,
  isAdmin?: boolean,
} | undefined

export const userAtom = atom<IUser>({
  key: 'user',
  default: loadUser
})

async function loadUser(): Promise<IUser> {
  if (isDev) return { name: 'Dev User', isAdmin: true }
  let rtn = (await axios.get('/apis/profile')).data
  if (rtn.code) return undefined
  return rtn
}