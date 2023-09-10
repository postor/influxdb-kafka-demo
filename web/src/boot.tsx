import "inter-ui/inter.css"
import './assets/global.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'awesome-notifications/dist/style.css'

import { createRoot } from 'react-dom/client'
import { BrowserRouter, useRoutes } from "react-router-dom"
import { Suspense } from 'react'
import getRoutes from './shack-get-routes'
import { RecoilRoot } from 'recoil'

let routes = getRoutes()
console.log(routes)

const App = () => {
  return useRoutes(routes)
}

createRoot(document.getElementById('react-root')).render(
  <RecoilRoot>
    <BrowserRouter>
      <Suspense fallback={'loading...'}>
        <App />
      </Suspense>
    </BrowserRouter>
  </RecoilRoot>
)
