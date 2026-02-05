import{v as i,S as c,p as d,j as u,i as y,f as g,e as m,d as p}from"./package-CRb3G6jY.js";function v(){return v=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var o=arguments[t];for(var a in o)({}).hasOwnProperty.call(o,a)&&(e[a]=o[a])}return e},v.apply(null,arguments)}function w(e){if(typeof e=="string")try{e=JSON.parse(e)}catch{return{}}return e}class x{constructor(){this.map=new Map}getCallbacks(t){return this.map.get(t)||[]}removeCallback(t,o){const a=this.map.get(t)||[];if(!a)return;if(!o)return void this.map.delete(t);const r=a.indexOf(o);r!==-1&&a.splice(r,1),a.length===0?this.map.delete(t):this.map.set(t,a)}shiftCallback(t){const o=this.getCallbacks(t);if(o.length===0)return;const a=o.shift();return this.removeCallback(t,a),a}storeCallback(t,o){const a=this.map.get(t)||[];a.push(o),this.map.set(t,a)}}class F{constructor(t){this.iframe=void 0,this.callbackStore=void 0,this.guid=void 0,this.messageHandler=void 0,this.originUrl=void 0,this.origin="*",this.readyPromise=void 0,this.version=3,this.iframe=t,this.originUrl=new URL(this.iframe.src).origin,this.guid=crypto.randomUUID(),this.callbackStore=new x,this.readyPromise=new Promise(o=>{this.messageHandler=a=>{if(a.origin!==this.originUrl)return;const r=w(a.data);if(r?.version===this.version&&(r?.action!=="handshake"||r?.guid===this.guid))if(r?.action!=="ready"){if(r?.action==="handshake")return this.origin=a.origin,void o();this.processData(r)}else{const n=this.findIframe(r.value);n?n===this.iframe&&(this.origin=a.origin,o()):console.error("[Qumu Cloud Player SDK]","A Qumu Cloud player is ready but it is impossible to find the corresponding iFrame, the SDK will not work correctly. Incorrect URL is:",r.value)}},window.addEventListener("message",this.messageHandler)}),this.postMessage({action:"handshake",guid:this.guid})}addEventListener(t,o){if(!t)throw new TypeError("You must pass an event name.");if(!o)throw new TypeError("You must pass a callback function.");if(typeof o!="function")throw new TypeError("The callback must be a function.");if(t==="ready")return this.callbackStore.storeCallback(`event:${t}`,o),void this.readyPromise.then(()=>{this.callbackStore.getCallbacks(`event:${t}`).includes(o)&&o()});this.callbackStore.getCallbacks(`event:${t}`).length===0&&this.readyPromise.then(()=>{this.postMessage({action:"event",guid:this.guid,name:t,value:"add"})}),this.callbackStore.storeCallback(`event:${t}`,o)}destroy(){this.messageHandler&&window.removeEventListener("message",this.messageHandler),this.postMessage({action:"command",guid:this.guid,name:"destroy"})}disableCaptionTrack(){this.enableCaptionTrack(null)}enableCaptionTrack(t){this.set("captionTrack",t)}async getAudienceReactions(){return this.get("audienceReactions")}async getCaptionTracks(){return this.get("captionTracks")}async getChapters(){return this.get("chapters")}async getCurrentChapter(){return this.get("chapter")}async getCurrentCaptionTrack(){return this.get("captionTrack")}async getCurrentTime(){return this.get("currentTime")}async getDuration(){return this.get("duration")}async getLayout(){return this.get("layout")}async getLevel(){return this.get("level")}async getLevels(){return this.get("levels")}async getLiveEndTime(){return this.get("liveEndTime")}async getLiveStartTime(){return this.get("liveStartTime")}async getLiveState(){return this.get("liveState")}async getPictureInPicturePosition(){return this.get("pipPosition")}async getPlaybackLevel(){return this.get("playbackLevel")}async getPlaybackRate(){return this.get("playbackRate")}async getPlaybackRates(){return this.get("playbackRates")}async getPresentation(){return this.get("presentation")}async getPrimaryContent(){return this.get("primaryContent")}async getSideBySideRatio(){return this.get("sideBySideRatio")}async getVolume(){return this.get("volume")}async isPaused(){return this.get("paused")}pause(){this.command("pause")}play(){this.command("play")}sendAudienceReaction(t){this.set("audienceReaction",t)}removeEventListener(t,o){if(!t)throw new TypeError("You must pass an event name.");this.callbackStore.removeCallback(`event:${t}`,o),this.callbackStore.getCallbacks(`event:${t}`).length===0&&this.postMessage({action:"event",guid:this.guid,name:t,value:"remove"})}setCurrentTime(t){if(t<0)throw new Error("The current time must be superior or equal to 0");this.set("currentTime",t)}setLayout(t){this.set("layout",t)}setLevel(t){if(t<-1||t===0)throw new Error("The level must set to -1 for automatic switching or be superior to 0");this.set("level",t)}setPictureInPicturePosition(t){this.set("pipPosition",t)}setPlaybackRate(t){if(t<0)throw new Error("The playback rate must be superior or equal to 0");if(t>2)throw new Error("The playback rate must be inferior or equal to 2");this.set("playbackRate",t)}setPrimaryContent(t){this.set("primaryContent",t)}setSideBySideRatio(t){if(t<50||t>80)throw new Error("The ratio must be between 50 and 80");this.set("sideBySideRatio",t)}setVolume(t){if(t<0||t>100)throw new Error("The volume must be between 0 and 100");this.set("volume",t)}command(t,o){const a={action:"command",guid:this.guid,name:t};o&&(a.value=o),this.postMessage(a)}findIframe(t){if(!t)return this.iframe;const o=window.document.querySelector(`iframe[src="${t}"]`);if(o)return o;const a=window.document.querySelectorAll("iframe"),r=decodeURIComponent(t);for(const n of a)if(r===decodeURIComponent(n.src))return n}async get(t){return await this.readyPromise,new Promise((o,a)=>{try{this.callbackStore.storeCallback(`get:${t}`,{reject:a,resolve:o}),this.postMessage({action:"get",guid:this.guid,name:t})}catch(r){a(r)}})}postMessage(t){var o;const a=JSON.stringify(v({},t,{version:this.version}));(o=this.iframe.contentWindow)==null||o.postMessage(a,this.origin)}processData(t){const o=w(t);let a=[];if(o?.version===this.version&&o?.guid===this.guid){if(o.action==="event")a=this.callbackStore.getCallbacks(`${o.action}:${o.name}`);else if(o.action==="get"||o.action==="set"){const r=this.callbackStore.shiftCallback(`${o.action}:${o.name}`);r&&a.push(r)}a.forEach(r=>{typeof r=="function"?r(o.value):r.resolve(o.value)})}}set(t,o){if(o===void 0)throw new TypeError("A value must be set.");this.readyPromise.then(()=>{this.postMessage({action:"set",guid:this.guid,name:t,value:o})})}}function S(e){const t={};e.styleBorderRadius&&(t.borderRadius=e.styleBorderRadius),e.styleHeight&&(t.height=e.styleHeight),e.styleWidth&&(t.width=e.styleWidth);const o={};e.styleCloseButtonActiveBackgroundColor&&(o.activeBackgroundColor=e.styleCloseButtonActiveBackgroundColor),e.styleCloseButtonActiveColor&&(o.activeColor=e.styleCloseButtonActiveColor),e.styleCloseButtonBackgroundColor&&(o.backgroundColor=e.styleCloseButtonBackgroundColor),e.styleCloseButtonBoxShadow&&(o.boxShadow=e.styleCloseButtonBoxShadow),e.styleCloseButtonColor&&(o.color=e.styleCloseButtonColor),e.styleCloseButtonHoverBackgroundColor&&(o.hoverBackgroundColor=e.styleCloseButtonHoverBackgroundColor),e.styleCloseButtonHoverColor&&(o.hoverColor=e.styleCloseButtonHoverColor),e.styleCloseButtonIconSize&&(o.iconSize=e.styleCloseButtonIconSize),e.styleCloseButtonPadding&&(o.padding=e.styleCloseButtonPadding),Object.keys(o).length&&(t.closeButton=o);const a={};e.styleDialogBackdropColor&&(a.backdropColor=e.styleDialogBackdropColor),e.styleDialogBackgroundColor&&(a.backgroundColor=e.styleDialogBackgroundColor),e.styleDialogBorder&&(a.border=e.styleDialogBorder),e.styleDialogBorderRadius&&(a.borderRadius=e.styleDialogBorderRadius),e.styleDialogMaxWidth&&(a.maxWidth=e.styleDialogMaxWidth),e.styleDialogPadding&&(a.padding=e.styleDialogPadding),e.styleDialogWidth&&(a.width=e.styleDialogWidth),Object.keys(a).length&&(t.dialog=a);const r={};e.stylePlayButtonActiveBackgroundColor&&(r.activeBackgroundColor=e.stylePlayButtonActiveBackgroundColor),e.stylePlayButtonActiveColor&&(r.activeColor=e.stylePlayButtonActiveColor),e.stylePlayButtonBackgroundColor&&(r.backgroundColor=e.stylePlayButtonBackgroundColor),e.stylePlayButtonColor&&(r.color=e.stylePlayButtonColor),e.stylePlayButtonHoverBackgroundColor&&(r.hoverBackgroundColor=e.stylePlayButtonHoverBackgroundColor),e.stylePlayButtonHoverColor&&(r.hoverColor=e.stylePlayButtonHoverColor),e.stylePlayButtonMargin&&(r.margin=e.stylePlayButtonMargin),e.stylePlayButtonPadding&&(r.padding=e.stylePlayButtonPadding),e.stylePlayButtonPosition&&(r.position=e.stylePlayButtonPosition),e.stylePlayButtonHeight&&(r.height=e.stylePlayButtonHeight),e.stylePlayButtonWidth&&(r.width=e.stylePlayButtonWidth),Object.keys(r).length&&(t.playButton=r);const n={};e.styleThumbnailImageFit&&(n.imageFit=e.styleThumbnailImageFit),Object.keys(n).length&&(t.thumbnail=n);const s={};e.styleNotFoundBackgroundColor&&(s.backgroundColor=e.styleNotFoundBackgroundColor),e.styleNotFoundBorder&&(s.border=e.styleNotFoundBorder),e.styleNotFoundColor&&(s.color=e.styleNotFoundColor),e.styleNotFoundIconColor&&(s.iconColor=e.styleNotFoundIconColor),Object.keys(s).length&&(t.notFound=s);const l={};e.playerAudio!==void 0&&(l.audio=e.playerAudio),e.playerCaptions!==void 0&&(l.captions=e.playerCaptions),e.playerConfigurationGuid!==void 0&&(l.playerConfigurationGuid=e.playerConfigurationGuid),e.playerDebug!==void 0&&(l.debug=e.playerDebug),e.playerLoop!==void 0&&(l.loop=e.playerLoop),e.playerView!==void 0&&(l.pv=e.playerView),e.playerQuality!==void 0&&(l.quality=e.playerQuality),e.playerReporting!==void 0&&(l.reporting=e.playerReporting),e.playerReportingId!==void 0&&(l.reportingId=e.playerReportingId),e.playerShowControlPanel!==void 0&&(l.showControlPanel=e.playerShowControlPanel),e.playerSidebar!==void 0&&(l.sidebar=e.playerSidebar),e.playerStart!==void 0&&(l.start=e.playerStart),e.playerVolume!==void 0&&(l.volume=e.playerVolume);const h={};e.playbackMode!==void 0&&(h.playbackMode=e.playbackMode),e.playIconUrl&&(h.playIconUrl=e.playIconUrl),Object.keys(t).length&&(h.style=t);const B={host:e.host,guid:e.guid};return Object.keys(l).length&&(B.playerParameters=l),Object.keys(h).length&&(B.widgetOptions=h),B}const W={component:"presentation-widget"},b={parameters:{docs:{source:{code:`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>`}}},render:()=>{const e=document.createElement("div");return c.create({guid:"JN6JHrg17xpwF8klXSIfFj",host:"demo.qumucloud.com",locales:{de:p,es:m,fr:g,it:y,ja:u,pt:d},selector:e}).catch(console.error),e}},C={parameters:{docs:{source:{code:`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
        widgetOptions: {
          playbackMode: 'modal',
        },
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>`}}},render:()=>{const e=document.createElement("div");e.style.display="grid",e.style.gap="16px",e.style.gridTemplateColumns="repeat(2, 1fr)";const t=document.createElement("div"),o=document.createElement("div");return e.appendChild(t),e.appendChild(o),c.create({guid:"JN6JHrg17xpwF8klXSIfFj",host:"demo.qumucloud.com",locales:{de:p,es:m,fr:g,it:y,ja:u,pt:d},selector:t,widgetOptions:{playbackMode:"inline"}}).catch(console.error),c.create({guid:"JN6JHrg17xpwF8klXSIfFj",host:"demo.qumucloud.com",locales:{de:p,es:m,fr:g,it:y,ja:u,pt:d},selector:o,widgetOptions:{playbackMode:"modal"}}).catch(console.error),e}},f={parameters:{docs:{source:{code:`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
        widgetOptions: {
          playIconUrl: 'https://demo.qumucloud.com/widgets/resources/custom-play-icon.png',
          style: {
            playButton: {
              height: '48px',
              position: 'end start',
              width: '102px'
            },
          },
        },
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>`}}},render:()=>{const e=document.createElement("div");return c.create({guid:"JN6JHrg17xpwF8klXSIfFj",host:"demo.qumucloud.com",locales:{de:p,es:m,fr:g,it:y,ja:u,pt:d},selector:e,widgetOptions:{playIconUrl:"https://demo.qumucloud.com/widgets/resources/custom-play-icon.png",style:{playButton:{height:"48px",position:"bottom-left",width:"102px"}}}}).catch(console.error),e}},P={parameters:{docs:{source:{code:`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@${i}/dist/presentation-widget.js';
      import { PlayerSdk } from "https://unpkg.com/@enghouse-qumu/player-sdk@3.2.1/dist/index.modern.mjs";

      PresentationWidget.create({
        host:'demo.qumucloud.com',
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        selector: '#widget',
        widgetOptions: {
          onIframeLoad(iframe) {
            const logsEl = document.querySelector("#logs");

            const sdk = new PlayerSdk(iframe);

            sdk.addEventListener("timeupdate", (newTime) => {
              logsEl.innerHTML += \`<li>timeupdate: \${newTime}</li>\`;
            });

            sdk.getDuration().then((duration) => {
              logsEl.innerHTML += \`<li>duration: \${newTime}</li>\`;
            });
          },
        },
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>`}}},render:()=>{const e=document.createElement("div");e.style.display="grid",e.style.gap="16px",e.style.gridTemplateColumns="repeat(2, 1fr)";const t=document.createElement("div");t.style.width="640px",t.style.height="360px";const o=document.createElement("ul");return o.style.maxHeight="360px",o.style.overflowY="auto",o.style.listStyle="none",o.style.padding="0",o.style.margin="0",o.style.flex="1",e.appendChild(t),e.appendChild(o),c.create({guid:"JN6JHrg17xpwF8klXSIfFj",host:"demo.qumucloud.com",locales:{de:p,es:m,fr:g,it:y,ja:u,pt:d},selector:t,widgetOptions:{onIframeLoad(a){const r=new F(a);r.addEventListener("timeupdate",n=>{o.innerHTML+=`<li>timeupdate: ${n}</li>`}),r.getDuration().then(n=>{o.innerHTML+=`<li>duration: ${n}</li>`}).catch(console.error)}}}).catch(console.error),e}},k={args:{host:"demo.qumucloud.com",guid:"JN6JHrg17xpwF8klXSIfFj",playbackMode:"inline"},argTypes:{host:{control:"text",table:{category:"Configuration"}},guid:{control:"text",table:{category:"Configuration"}},playbackMode:{control:"select",name:"Playback Mode",options:["inline","inline-autoload","inline-autoplay","modal"],table:{defaultValue:{summary:"inline"},category:"Configuration"}},playIconUrl:{control:"text",name:"Custom Play Icon URL",table:{category:"Configuration"}},playerAudio:{control:"text",name:"Audio Language",table:{category:"Configuration",subcategory:"Player Parameters"}},playerCaptions:{control:"text",name:"Captions Language",table:{category:"Configuration",subcategory:"Player Parameters"}},playerConfigurationGuid:{control:"text",name:"Player Configuration Guid",table:{category:"Configuration",subcategory:"Player Parameters"}},playerDebug:{control:"boolean",name:"Enable Debug Mode",table:{category:"Configuration",subcategory:"Player Parameters"}},playerLoop:{control:"boolean",name:"Loop",table:{category:"Configuration",subcategory:"Player Parameters"}},playerQuality:{control:"select",name:"Quality",options:["auto","best","1440p","1080p","720p","360p","240p"],table:{category:"Configuration",subcategory:"Player Parameters"}},playerReporting:{control:"boolean",name:"Enable Playback Analytics",table:{category:"Configuration",subcategory:"Player Parameters"}},playerReportingId:{control:"text",name:"Reporting ID",table:{category:"Configuration",subcategory:"Player Parameters"}},playerShowControlPanel:{control:"boolean",name:"Show the Control Panel",table:{category:"Configuration",subcategory:"Player Parameters"}},playerSidebar:{control:"boolean",name:"Show the Sidebar",table:{category:"Configuration",subcategory:"Player Parameters"}},playerStart:{control:"text",name:"Start at",table:{category:"Configuration",subcategory:"Player Parameters"}},playerView:{control:"select",name:"View",options:["pipls","pipss","sbs"],table:{category:"Configuration",subcategory:"Player Parameters"}},playerVolume:{control:"range",max:100,min:0,name:"Volume",table:{category:"Configuration",subcategory:"Player Parameters"}},styleWidth:{control:"text",name:"Width",table:{category:"Style",subcategory:"Widget"}},styleHeight:{control:"text",name:"Height",table:{category:"Style",subcategory:"Widget"}},styleBorderRadius:{control:"text",name:"Border Radius",table:{category:"Style",subcategory:"Widget"}},stylePlayButtonBackgroundColor:{control:"color",name:"Background Color (default state)",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonColor:{control:"color",name:"Color (default state)",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonHoverBackgroundColor:{control:"color",name:"Background Color (hover state)",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonHoverColor:{control:"color",name:"Color (hover state)",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonActiveBackgroundColor:{control:"color",name:"Background Color (active state)",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonActiveColor:{control:"color",name:"Color (active state)",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonMargin:{control:"text",name:"Margin",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonPadding:{control:"text",name:"Padding",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonPosition:{control:"select",name:"Position",options:["top-left","top","top-right","left","center","right","bottom-left","bottom","bottom-right"],table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonHeight:{control:"text",name:"Height",table:{category:"Style",subcategory:"Play Button"}},stylePlayButtonWidth:{control:"text",name:"Width",table:{category:"Style",subcategory:"Play Button"}},styleThumbnailImageFit:{control:"text",name:"Image Fit",table:{category:"Style",subcategory:"Thumbnail"}},styleDialogBackdropColor:{control:"color",name:"Backdrop Color",if:{arg:"playbackMode",eq:"modal"},table:{category:"Style",subcategory:"Dialog"}},styleDialogBackgroundColor:{control:"color",name:"Background Color",if:{arg:"playbackMode",eq:"modal"},table:{category:"Style",subcategory:"Dialog"}},styleDialogBorder:{control:"text",name:"Border",if:{arg:"playbackMode",eq:"modal"},table:{category:"Style",subcategory:"Dialog"}},styleDialogBorderRadius:{control:"text",name:"Border Radius",if:{arg:"playbackMode",eq:"modal"},table:{category:"Style",subcategory:"Dialog"}},styleDialogMaxWidth:{control:"text",name:"Max Width",if:{arg:"playbackMode",eq:"modal"},table:{category:"Style",subcategory:"Dialog"}},styleDialogPadding:{control:"text",name:"Padding",if:{arg:"playbackMode",eq:"modal"},table:{category:"Style",subcategory:"Dialog"}},styleDialogWidth:{control:"text",name:"Width",if:{arg:"playbackMode",eq:"modal"},table:{category:"Style",subcategory:"Dialog"}},styleCloseButtonBackgroundColor:{control:"color",name:"Background Color (default state)",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonColor:{control:"color",name:"Color (default state)",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonHoverBackgroundColor:{control:"color",name:"Background Color (hover state)",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonHoverColor:{control:"color",name:"Color (hover state)",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonActiveBackgroundColor:{control:"color",name:"Background Color (active state)",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonActiveColor:{control:"color",name:"Color (active state)",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonBoxShadow:{control:"text",name:"Box Shadow",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonIconSize:{control:"text",name:"Icon Size",table:{category:"Style",subcategory:"Close Button"}},styleCloseButtonPadding:{control:"text",name:"Padding",table:{category:"Style",subcategory:"Close Button"}},styleNotFoundBackgroundColor:{control:"color",name:"Background Color",table:{category:"Style",subcategory:"Not Found"}},styleNotFoundBorder:{control:"text",name:"Border",table:{category:"Style",subcategory:"Not Found"}},styleNotFoundColor:{control:"color",name:"Color",table:{category:"Style",subcategory:"Not Found"}},styleNotFoundIconColor:{control:"color",name:"Icon Color",table:{category:"Style",subcategory:"Not Found"}}},parameters:{docs:{source:{transform:(e,t)=>{const o=S(t.args);return`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@${i}/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@${i}/presentation-widget.js';

      PresentationWidget.create(${JSON.stringify(o,null,2).split(`
`).map((a,r)=>r===0?a:`      ${a}`).join(`
`)}).catch((err) => console.log(err));
    <\/script>
  </body>
</html>
          `}}}},render:e=>{const t=document.createElement("div");return c.create({locales:{de:p,es:m,fr:g,it:y,ja:u,pt:d},selector:t,...S(e)}).catch(console.error),t}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        code: \`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>\`
      }
    }
  },
  render: () => {
    const container = document.createElement('div');
    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt
      },
      selector: container
    }).catch(console.error);
    return container;
  }
}`,...b.parameters?.docs?.source}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        code: \`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
        widgetOptions: {
          playbackMode: 'modal',
        },
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>\`
      }
    }
  },
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '16px';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    const playbackWidget = document.createElement('div');
    const thumbnailWidget = document.createElement('div');
    container.appendChild(playbackWidget);
    container.appendChild(thumbnailWidget);
    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt
      },
      selector: playbackWidget,
      widgetOptions: {
        playbackMode: 'inline'
      }
    }).catch(console.error);
    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt
      },
      selector: thumbnailWidget,
      widgetOptions: {
        playbackMode: 'modal'
      }
    }).catch(console.error);
    return container;
  }
}`,...C.parameters?.docs?.source}}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        code: \`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.js';

      PresentationWidget.create({
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        host: 'demo.qumucloud.com',
        selector: '#widget',
        widgetOptions: {
          playIconUrl: 'https://demo.qumucloud.com/widgets/resources/custom-play-icon.png',
          style: {
            playButton: {
              height: '48px',
              position: 'end start',
              width: '102px'
            },
          },
        },
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>\`
      }
    }
  },
  render: () => {
    const container = document.createElement('div');
    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt
      },
      selector: container,
      widgetOptions: {
        playIconUrl: 'https://demo.qumucloud.com/widgets/resources/custom-play-icon.png',
        style: {
          playButton: {
            height: '48px',
            position: 'bottom-left',
            width: '102px'
          }
        }
      }
    }).catch(console.error);
    return container;
  }
}`,...f.parameters?.docs?.source}}};P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      source: {
        code: \`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@\${version}/dist/presentation-widget.js';
      import { PlayerSdk } from "https://unpkg.com/@enghouse-qumu/player-sdk@3.2.1/dist/index.modern.mjs";

      PresentationWidget.create({
        host:'demo.qumucloud.com',
        guid: 'JN6JHrg17xpwF8klXSIfFj',
        selector: '#widget',
        widgetOptions: {
          onIframeLoad(iframe) {
            const logsEl = document.querySelector("#logs");

            const sdk = new PlayerSdk(iframe);

            sdk.addEventListener("timeupdate", (newTime) => {
              logsEl.innerHTML += \\\`<li>timeupdate: \\\${newTime}</li>\\\`;
            });

            sdk.getDuration().then((duration) => {
              logsEl.innerHTML += \\\`<li>duration: \\\${newTime}</li>\\\`;
            });
          },
        },
      }).catch((err) => console.log(err));
    <\/script>
  </body>
</html>\`
      }
    }
  },
  render: () => {
    // Create container elements
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gap = '16px';
    container.style.gridTemplateColumns = 'repeat(2, 1fr)';
    const widget = document.createElement('div');
    widget.style.width = '640px';
    widget.style.height = '360px';
    const logs = document.createElement('ul');
    logs.style.maxHeight = '360px';
    logs.style.overflowY = 'auto';
    logs.style.listStyle = 'none';
    logs.style.padding = '0';
    logs.style.margin = '0';
    logs.style.flex = '1';
    container.appendChild(widget);
    container.appendChild(logs);
    PresentationWidget.create({
      guid: 'JN6JHrg17xpwF8klXSIfFj',
      host: 'demo.qumucloud.com',
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt
      },
      selector: widget,
      widgetOptions: {
        onIframeLoad(iframe: HTMLIFrameElement) {
          const sdk = new QumuPlayerSdk(iframe);
          sdk.addEventListener('timeupdate', (newTime: number) => {
            logs.innerHTML += \`<li>timeupdate: \${newTime}</li>\`;
          });
          sdk.getDuration().then((duration: number) => {
            logs.innerHTML += \`<li>duration: \${duration}</li>\`;
          }).catch(console.error);
        }
      }
    }).catch(console.error);
    return container;
  }
}`,...P.parameters?.docs?.source}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    /* eslint-disable sort-keys */
    host: 'demo.qumucloud.com',
    guid: 'JN6JHrg17xpwF8klXSIfFj',
    playbackMode: 'inline'
    /* eslint-enable sort-keys */
  },
  /* eslint-disable sort-keys */
  argTypes: {
    host: {
      control: 'text',
      table: {
        category: 'Configuration'
      }
    },
    guid: {
      control: 'text',
      table: {
        category: 'Configuration'
      }
    },
    playbackMode: {
      control: 'select',
      name: 'Playback Mode',
      options: ['inline', 'inline-autoload', 'inline-autoplay', 'modal'],
      table: {
        defaultValue: {
          summary: 'inline'
        },
        category: 'Configuration'
      }
    },
    playIconUrl: {
      control: 'text',
      name: 'Custom Play Icon URL',
      table: {
        category: 'Configuration'
      }
    },
    playerAudio: {
      control: 'text',
      name: 'Audio Language',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerCaptions: {
      control: 'text',
      name: 'Captions Language',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerConfigurationGuid: {
      control: 'text',
      name: 'Player Configuration Guid',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerDebug: {
      control: 'boolean',
      name: 'Enable Debug Mode',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerLoop: {
      control: 'boolean',
      name: 'Loop',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerQuality: {
      control: 'select',
      name: 'Quality',
      options: ['auto', 'best', '1440p', '1080p', '720p', '360p', '240p'],
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerReporting: {
      control: 'boolean',
      name: 'Enable Playback Analytics',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerReportingId: {
      control: 'text',
      name: 'Reporting ID',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerShowControlPanel: {
      control: 'boolean',
      name: 'Show the Control Panel',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerSidebar: {
      control: 'boolean',
      name: 'Show the Sidebar',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerStart: {
      control: 'text',
      name: 'Start at',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerView: {
      control: 'select',
      name: 'View',
      options: ['pipls', 'pipss', 'sbs'],
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    playerVolume: {
      control: 'range',
      max: 100,
      min: 0,
      name: 'Volume',
      table: {
        category: 'Configuration',
        subcategory: 'Player Parameters'
      }
    },
    // Style
    styleWidth: {
      control: 'text',
      name: 'Width',
      table: {
        category: 'Style',
        subcategory: 'Widget'
      }
    },
    styleHeight: {
      control: 'text',
      name: 'Height',
      table: {
        category: 'Style',
        subcategory: 'Widget'
      }
    },
    styleBorderRadius: {
      control: 'text',
      name: 'Border Radius',
      table: {
        category: 'Style',
        subcategory: 'Widget'
      }
    },
    stylePlayButtonBackgroundColor: {
      control: 'color',
      name: 'Background Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonColor: {
      control: 'color',
      name: 'Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonHoverBackgroundColor: {
      control: 'color',
      name: 'Background Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonHoverColor: {
      control: 'color',
      name: 'Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonActiveBackgroundColor: {
      control: 'color',
      name: 'Background Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonActiveColor: {
      control: 'color',
      name: 'Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonMargin: {
      control: 'text',
      name: 'Margin',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonPadding: {
      control: 'text',
      name: 'Padding',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonPosition: {
      control: 'select',
      name: 'Position',
      options: ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'],
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonHeight: {
      control: 'text',
      name: 'Height',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    stylePlayButtonWidth: {
      control: 'text',
      name: 'Width',
      table: {
        category: 'Style',
        subcategory: 'Play Button'
      }
    },
    styleThumbnailImageFit: {
      control: 'text',
      name: 'Image Fit',
      table: {
        category: 'Style',
        subcategory: 'Thumbnail'
      }
    },
    styleDialogBackdropColor: {
      control: 'color',
      name: 'Backdrop Color',
      if: {
        arg: 'playbackMode',
        eq: 'modal'
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog'
      }
    },
    styleDialogBackgroundColor: {
      control: 'color',
      name: 'Background Color',
      if: {
        arg: 'playbackMode',
        eq: 'modal'
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog'
      }
    },
    styleDialogBorder: {
      control: 'text',
      name: 'Border',
      if: {
        arg: 'playbackMode',
        eq: 'modal'
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog'
      }
    },
    styleDialogBorderRadius: {
      control: 'text',
      name: 'Border Radius',
      if: {
        arg: 'playbackMode',
        eq: 'modal'
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog'
      }
    },
    styleDialogMaxWidth: {
      control: 'text',
      name: 'Max Width',
      if: {
        arg: 'playbackMode',
        eq: 'modal'
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog'
      }
    },
    styleDialogPadding: {
      control: 'text',
      name: 'Padding',
      if: {
        arg: 'playbackMode',
        eq: 'modal'
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog'
      }
    },
    styleDialogWidth: {
      control: 'text',
      name: 'Width',
      if: {
        arg: 'playbackMode',
        eq: 'modal'
      },
      table: {
        category: 'Style',
        subcategory: 'Dialog'
      }
    },
    styleCloseButtonBackgroundColor: {
      control: 'color',
      name: 'Background Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonColor: {
      control: 'color',
      name: 'Color (default state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonHoverBackgroundColor: {
      control: 'color',
      name: 'Background Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonHoverColor: {
      control: 'color',
      name: 'Color (hover state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonActiveBackgroundColor: {
      control: 'color',
      name: 'Background Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonActiveColor: {
      control: 'color',
      name: 'Color (active state)',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonBoxShadow: {
      control: 'text',
      name: 'Box Shadow',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonIconSize: {
      control: 'text',
      name: 'Icon Size',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleCloseButtonPadding: {
      control: 'text',
      name: 'Padding',
      table: {
        category: 'Style',
        subcategory: 'Close Button'
      }
    },
    styleNotFoundBackgroundColor: {
      control: 'color',
      name: 'Background Color',
      table: {
        category: 'Style',
        subcategory: 'Not Found'
      }
    },
    styleNotFoundBorder: {
      control: 'text',
      name: 'Border',
      table: {
        category: 'Style',
        subcategory: 'Not Found'
      }
    },
    styleNotFoundColor: {
      control: 'color',
      name: 'Color',
      table: {
        category: 'Style',
        subcategory: 'Not Found'
      }
    },
    styleNotFoundIconColor: {
      control: 'color',
      name: 'Icon Color',
      table: {
        category: 'Style',
        subcategory: 'Not Found'
      }
    }
  },
  /* eslint-enable sort-keys */
  parameters: {
    docs: {
      source: {
        transform: (_: string, storyContext: StoryContext) => {
          const configuration = getPlaygroundConfigurationFromArgs(storyContext.args);
          return \`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <title>Presentation Widget</title>
    <link rel="stylesheet" href="https://unpkg.com/@enghouse-qumu/widgets@\${version}/presentation-widget.css">
  </head>
  <body>
    <div id="widget"></div>

    <script type="module">
      import { PresentationWidget } from 'https://unpkg.com/@enghouse-qumu/widgets@\${version}/presentation-widget.js';

      PresentationWidget.create(\${JSON.stringify(configuration, null, 2).split('\\n')
          // add 6 spaces (indent level inside <script>)
          .map((line, i) => i === 0 ? line : \`      \${line}\`).join('\\n')}).catch((err) => console.log(err));
    <\/script>
  </body>
</html>
          \`;
        }
      }
    }
  },
  render: (args: Partial<Args>) => {
    const container = document.createElement('div');
    PresentationWidget.create({
      locales: {
        de,
        es,
        fr,
        it,
        ja,
        pt
      },
      selector: container,
      ...getPlaygroundConfigurationFromArgs(args)
    }).catch(console.error);
    return container;
  }
}`,...k.parameters?.docs?.source}}};const I=["Basic","PlaybackThumbnail","CustomPlayIcon","PlayerSdk","Playground"];export{b as Basic,f as CustomPlayIcon,C as PlaybackThumbnail,P as PlayerSdk,k as Playground,I as __namedExportsOrder,W as default};
