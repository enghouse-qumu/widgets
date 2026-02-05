import{j as e,M as d,C as a}from"./blocks-D3dToMsS.js";import{useMDXComponents as l}from"./index-g-aZEGLy.js";import{Localization as s}from"./localization.stories-B3TZlnzZ.js";import{T as o}from"./Tip-7B9_ZX6e.js";import"./preload-helper-PPVm8Dsz.js";import"./iframe-Bh-cF43l.js";import"./package-BwQv5pWs.js";function t(i){const n={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",ul:"ul",...l(),...i.components};return e.jsxs(e.Fragment,{children:[e.jsx(d,{title:"Getting Started/Localization"}),`
`,e.jsx(n.h1,{id:"localization",children:"Localization"}),`
`,e.jsx(n.p,{children:"Widgets support the following languages:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"de"})}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"en"})," (default - automatically loaded)"]}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"es"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"fr"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"it"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"ja"})}),`
`,e.jsx(n.li,{children:e.jsx(n.code,{children:"pt"})}),`
`]}),`
`,e.jsxs(n.p,{children:["You can request a new language by opening an issue on ",e.jsx(n.a,{href:"https://github.com/qumu/widgets/issues/new",rel:"nofollow",children:"GitHub"}),"."]}),`
`,e.jsxs(n.p,{children:["You can override the locale by setting the ",e.jsx(n.code,{children:"lang"})," attribute on the widget's parent element or on the widget itself."]}),`
`,e.jsx(o,{color:"warning",title:"Performance",children:e.jsxs(n.p,{children:["For performance reasons, only the ",e.jsx(n.code,{children:"en"})," language is loaded by default. To support additional languages, you will need to load them manually."]})}),`
`,e.jsx(n.h2,{id:"set-the-lang-for-the-whole-page",children:"Set the lang for the whole page"}),`
`,e.jsxs(n.p,{children:["By setting the lang attribute on the ",e.jsx(n.code,{children:"<html>"})," tag, the entire page will use the specified language, and all widgets on the page will automatically adopt it."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-html",children:`<html lang="fr">
  <body>
    <!-- Any widget will use the fr language -->
    <div id="widget"></div>
  </body>
</html>
`})}),`
`,e.jsx(n.h2,{id:"set-the-language-for-multiple-widgets",children:"Set the language for multiple widgets"}),`
`,e.jsxs(n.p,{children:["You can set the ",e.jsx(n.code,{children:"lang"})," attribute on a parent element of specific widgets to override their language."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-html",children:`<html lang="fr">
  <body>
    <!-- This widget will use the fr language -->
    <div id="widget1"></div>

    <!-- Any UI-Kit component inside the div will use the ja language -->
    <div lang="ja">
      <div id="widget2"></div>
      <div id="widget3"></div>
    </div>
  </body>
</html>
`})}),`
`,e.jsx(n.h2,{id:"set-the-language-for-a-specific-widget",children:"Set the language for a specific widget"}),`
`,e.jsxs(n.p,{children:["You can set the ",e.jsx(n.code,{children:"lang"})," attribute on a specific widget to override their language."]}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-html",children:`<html lang="fr">
  <body>
    <!-- This widget will use the fr language -->
    <div id="widget1"></div>

    <!-- This widget will use the ja language -->
    <div id="widget2" lang="ja"></div>
  </body>
</html>
`})}),`
`,e.jsx(n.h2,{id:"example",children:"Example"}),`
`,e.jsx(a,{of:s})]})}function p(i={}){const{wrapper:n}={...l(),...i.components};return n?e.jsx(n,{...i,children:e.jsx(t,{...i})}):t(i)}export{p as default};
