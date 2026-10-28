import { createRoot } from 'react-dom/client'
import './widget.css'
import Widget from './Widget.jsx'

createRoot(document.getElementById('root')).render(
  <Widget configuration={{
    host: 'demo.qumucloud.com',
    guid: 'JN6JHrg17xpwF8klXSIfFj',
  }}
  />
)
