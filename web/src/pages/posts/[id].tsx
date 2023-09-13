import { useParams } from "react-router"

export default () => {
  let { id } = useParams()
  return <h1>{id} from param</h1>
}