import { Outlet } from "react-router-dom"

export default ({ }) => {
  return <div>
    <p>layout for all posts</p>
    <div><Outlet /> </div>
  </div>
}