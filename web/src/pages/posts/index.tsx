import { Link } from "react-router-dom"

export default () => {
  return <div>
    <h1>post list</h1>
    <ul>
      <li>
        <Link to={'/posts/a'}>article A</Link>
      </li>
      <li>
        <Link to={'/posts/b'}>article B</Link>
      </li>
      <li>
        <Link to={'/posts/paramC'}>article C param url</Link>
      </li>
      <li>
        <Link to={'/posts/paramD'}>article B param url</Link>
      </li>
    </ul>
  </div>
}