import { atom } from "recoil";
import axios from 'axios'


type IUser = {
  name: string,
  isAdmin?: boolean,
} | undefined

export const userAtom = atom<IUser>({
  key: 'user',
  default: loadUser
})

async function loadUser(): Promise<IUser> {
  return { name: 'Dev User', isAdmin: true }
}