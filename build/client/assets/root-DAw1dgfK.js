import{j as t}from"./jsx-runtime-Z8WwdQU7.js";import{u as d,a as y,b as f,c as x,_ as S,M as j,L as w,O as g,S as k}from"./components-DpadYxWV.js";import{r as n}from"./index-BPQRexiR.js";/**
 * @remix-run/react v2.17.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let a="positions";function M({getKey:r,...l}){let{isSpaMode:c}=d(),o=y(),p=f();x({getKey:r,storageKey:a});let u=n.useMemo(()=>{if(!r)return null;let e=r(o,p);return e!==o.key?e:null},[]);if(c)return null;let h=((e,m)=>{if(!window.history.state||!window.history.state.key){let s=Math.random().toString(32).slice(2);window.history.replaceState({key:s},"")}try{let i=JSON.parse(sessionStorage.getItem(e)||"{}")[m||window.history.state.key];typeof i=="number"&&window.scrollTo(0,i)}catch(s){console.error(s),sessionStorage.removeItem(e)}}).toString();return n.createElement("script",S({},l,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${h})(${JSON.stringify(a)}, ${JSON.stringify(u)})`}}))}function R(){return t.jsxs("html",{children:[t.jsxs("head",{children:[t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width,initial-scale=1"}),t.jsx("link",{rel:"preconnect",href:"https://cdn.shopify.com/"}),t.jsx("link",{rel:"stylesheet",href:"https://cdn.shopify.com/static/fonts/inter/v4/styles.css"}),t.jsx(j,{}),t.jsx(w,{})]}),t.jsxs("body",{children:[t.jsx(g,{}),t.jsx(M,{}),t.jsx(k,{})]})]})}export{R as default};
