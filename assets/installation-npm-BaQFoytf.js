import{j as e,M as o}from"./blocks-D3dToMsS.js";import{useMDXComponents as s}from"./index-g-aZEGLy.js";import"./preload-helper-PPVm8Dsz.js";import"./iframe-Bh-cF43l.js";function i(t){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",p:"p",pre:"pre",...s(),...t.components};return e.jsxs(e.Fragment,{children:[e.jsx(o,{title:"Getting Started/Installation/Via NPM"}),`
`,e.jsx(n.h1,{id:"installation-via-npm",children:"Installation via NPM"}),`
`,e.jsx(n.p,{children:"Use this method if you use a bundler (Webpack, Rollup, Vite)"}),`
`,e.jsx(n.h2,{id:"installation",children:"Installation"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-sh",children:`npm install @enghouse-qumu/widgets
`})}),`
`,e.jsx(n.h2,{id:"usage",children:"Usage"}),`
`,e.jsx(n.p,{children:"Add the following code to your main JavaScript file."}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-js",children:`// import the CSS
import '@enghouse-qumu/widgets/presentation-widget.css';

// import the widget
import { PresentationWidget } from '@enghouse-qumu/widgets';
// import extra locales (if needed)
import fr from '@enghouse-qumu/widgets/locales/fr.json'

// configure the widget
const widget = await PresentationWidget.create({
  host: '',
  guid: '',
  selector: '',
  locales: {
    fr,
  },
});
`})}),`
`,e.jsx(n.h3,{id:"examples",children:"Examples"}),`
`,e.jsx(n.p,{children:"React example"}),`
`,e.jsx("iframe",{src:"https://codesandbox.io/embed/s3pqcs?view=split&module=%2Fsrc%2FWidget.js&fontsize=12",style:{width:"100%",height:"500px",border:"0",borderRadius:"4px",overflow:"hidden"},title:"presentation-widget-react"}),`
`,e.jsx(n.p,{children:"Vue example"}),`
`,e.jsx("iframe",{src:"https://codesandbox.io/p/devbox/nostalgic-scooby-z48ql7?embed=1&file=%2Fsrc%2Fcomponents%2FWidget.vue",style:{width:"100%",height:"500px",border:"0",borderRadius:"4px",overflow:"hidden"},title:"presentation-widget-vue"})]})}function c(t={}){const{wrapper:n}={...s(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(i,{...t})}):i(t)}export{c as default};
