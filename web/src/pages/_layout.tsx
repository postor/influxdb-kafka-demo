import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { useRecoilStateLoadable } from "recoil"
import { userAtom } from "../common/user"

let links = ['index', 'about', 'login', 'posts', 'admin']

export default ({ }) => {
  let location = useLocation()
  if (location.pathname.startsWith('/login')) return <Outlet />
  return <div>
    <LoginRedirect />
    <p>layout for all but login</p>
    <ul style={{ display: 'flex' }}>
      {links.map(x => <li key={x} style={{ padding: '0 10px', listStyle: 'none' }}>
        <Link to={x === 'index' ? '/' : '/' + x}>{x}</Link>
      </li>)}
    </ul>
    <div> <Outlet /> </div>
  </div>
}


function LoginRedirect() {
  let [{ contents, state }] = useRecoilStateLoadable(userAtom)
  switch (state) {
    case 'hasError':
      throw contents
    case 'hasValue':
      if (!contents) return <Navigate to={'/login'} />
  }
  return null
}