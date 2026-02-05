import{R as r,s as l}from"./blocks-D3dToMsS.js";const t={info:{backgroundColor:"#f0f8ff",borderColor:"#4994fc",color:"#002760",titleColor:"#0955c9"},warning:{backgroundColor:"#fffcdf",borderColor:"#f7c735",color:"#784618",titleColor:"#b47921"}},i=l.div`
  background-color: ${o=>t[o.color].backgroundColor};
  border-left: 5px solid ${o=>t[o.color].borderColor};
  color: ${o=>t[o.color].color};
  margin-bottom: 24px;
  padding: 10px 15px;
`,d=l.div`
  color: ${o=>t[o.color].titleColor};
  font-size: 18px;
  margin-bottom: 5px;
`,a=l.div`
  p:first-child {
    margin-top: 0;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;class f extends r.Component{render(){const{title:e,color:n="info",children:c}=this.props;return r.createElement(i,{color:n},e&&r.createElement(d,{color:n},e),r.createElement(a,null,c))}}export{f as T};
