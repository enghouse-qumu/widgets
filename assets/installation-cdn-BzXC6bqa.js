import{j as e,M as r}from"./blocks-D3dToMsS.js";import{useMDXComponents as s}from"./index-g-aZEGLy.js";import{T as i}from"./Tip-7B9_ZX6e.js";import"./preload-helper-PPVm8Dsz.js";import"./iframe-Bh-cF43l.js";function o(t){const n={a:"a",code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...s(),...t.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Getting Started/Installation/Via CDN"}),`
`,e.jsx(n.h1,{id:"installation-via-cdn",children:"Installation via CDN"}),`
`,e.jsx(n.p,{children:"Use this method if you do not use a bundler."}),`
`,e.jsx(i,{color:"warning",title:"Performance",children:"Using the library via a CDN may impact performance. For optimal performance, we recommend bundling the widget with your application and serving the files directly from your own infrastructure."}),`
`,e.jsx(n.h2,{id:"usage",children:"Usage"}),`
`,e.jsxs(i,{title:"Versioning",children:[e.jsx(n.p,{children:"For stability, we recommend specifying a fixed version of the widget in your project. This ensures that updates to the widget won’t accidentally break your implementation."}),e.jsxs(n.p,{children:["You can find the available versions here: ",e.jsx(n.a,{href:"https://www.npmjs.com/package/@enghouse-qumu/widgets",rel:"nofollow",children:"@enghouse-qumu/widgets on npm"}),"."]})]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-html",children:`<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Title</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@1.0.0/dist/presentation-widget.css">
  </head>
  <body>
    <main>
      <div id="widget"></div>
    </main>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@1.0.0/dist/presentation-widget.js';

      const fr = await fetch(
        "https://unpkg.com/@enghouse-qumu/widgets@1.0.0/dist/locales/fr.json"
      ).then((res) => res.json());

      PresentationWidget.create({
        selector: '#widget',
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        // import extra locales (if needed)
        locales: {
          fr,
        },
      });
    <\/script>
  </body>
</html>
`})}),`
`,e.jsx(n.h2,{id:"example",children:"Example"}),`
`,e.jsx("iframe",{src:"https://codesandbox.io/embed/vnt6z8?view=split&module=%2Findex.html&fontsize=12",style:{width:"100%",height:"500px",border:"0",borderRadius:"4px",overflow:"hidden"},title:"presentation-widget-html"})]})}function m(t={}){const{wrapper:n}={...s(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(o,{...t})}):o(t)}export{m as default};
