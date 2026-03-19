import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ブラウザ直接起動時（Electronなし）はモックAPIを注入
const isBrowser = !window.electronAPI

if (isBrowser) {
  import('./test/mockElectronAPI.js').then(({ installMockAPI }) => {
    installMockAPI()
    renderApp(true)
  })
} else {
  renderApp(false)
}

function renderApp(withTestUI) {
  const root = ReactDOM.createRoot(document.getElementById('root'))

  if (withTestUI) {
    import('./test/ScenarioSelector.jsx').then(({ ScenarioSelector }) => {
      root.render(
        <React.StrictMode>
          <div className="flex flex-col h-screen">
            <ScenarioSelector />
            <div className="flex-1 min-h-0">
              <App />
            </div>
          </div>
        </React.StrictMode>
      )
    })
  } else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
}
