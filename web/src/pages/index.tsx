import { Suspense } from "react"
import { useRecoilState } from "recoil"
import { userAtom } from "../common/user"

export default () => {
  return <div>
    <h1 className="bg-yellow-50">Home</h1>
    <Suspense fallback={'loading...'}>
      <UserName />
    </Suspense>
    <style jsx scoped>{`
      h1 {
        color: red;
      }
    `}</style>
  </div>
}

function UserName() {
  let [user] = useRecoilState(userAtom)
  return <span>{user.name}</span>
}