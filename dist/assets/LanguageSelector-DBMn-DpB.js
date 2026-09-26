import{u as I,j as i}from"./index-BGP9WeUm.js";import{r as a}from"./vendor-clerk-D4LDWiy6.js";/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=t=>t==null?void 0:t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function D(t,e,o=[]){if(e==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:_(t),size:24,node:e,...o.length>0?{aliases:o}:{}}}/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=t=>{let e="",o=!1;for(const s of t){if(s==="-"||s==="_"||s<=" "){o=e.length>0;continue}e.length===0?e+=s.toLowerCase():e+=o?s.toUpperCase():s,o=!1}return e};/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=t=>{const e=R(t);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=(...t)=>t.filter((e,o,s)=>!!e&&e.trim()!==""&&s.indexOf(e)===o).join(" ").trim();/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function y(t){return t!=null}function M(t,e={}){var k,b;const o=e.attributeNames??{},s=r=>o[r]??r,c=t.size??t.width??f.width,l=t.size??t.height??f.height,d=((k=t.aliases)==null?void 0:k.filter(r=>typeof r=="string"&&r.trim()!=="").map(r=>`lucide-${r}`))??[],h=[...t.name?[`lucide-${t.name}`]:[],...d],u=((b=e.className)==null?void 0:b.split(" ").filter(Boolean))??[],n=e.includeDefaultClasses===!1?v(...u):v("lucide",...h,...u),x=e.absoluteStrokeWidth?Number(e.strokeWidth??f["stroke-width"])*Number(t.size??t.width??f.width)/Number(e.size??e.width??f.width):e.strokeWidth??f["stroke-width"];return["svg",{...Object.entries(f).reduce((r,[m,w])=>(r[s(m)]=w,r),{}),..."color"in e&&e.color&&{[s("stroke")]:e.color},..."size"in e&&y(e.size)&&{[s("width")]:e.size,[s("height")]:e.size},..."width"in e&&y(e.width)&&{[s("width")]:e.width},..."height"in e&&y(e.height)&&{[s("height")]:e.height},[s("stroke-width")]:x,...n&&{[s("class")]:n},[s("viewBox")]:`0 0 ${c} ${l}`,...e.hasA11yProp===!1?{[s("aria-hidden")]:"true"}:{},..."attributes"in e&&e.attributes},t.node.map(r=>{const[m,w,p]=r,N=e.nonScalingStroke?{[s("vector-effect")]:"non-scaling-stroke",...w}:w;return p?[m,N,p]:[m,N]})]}/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function O(t,e={}){return M(t,{...e,attributeNames:{...e.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0;return!1},F=a.createContext({}),G=()=>a.useContext(F),U=a.forwardRef(({color:t,size:e,width:o,height:s,strokeWidth:c,absoluteStrokeWidth:l,nonScalingStroke:d,className:h="",children:u,iconNode:n=[],icon:x={node:n,aliases:[],size:24},...g},k)=>{const{size:b=24,strokeWidth:r=2,absoluteStrokeWidth:m=!1,nonScalingStroke:w=!1,color:p="currentColor",className:N=""}=G()??{},z=!!u||q(g),[A,W,$=[]]=O(x,{color:t??p,width:o??e??b,height:s??e??b,strokeWidth:c??r,absoluteStrokeWidth:l??m,nonScalingStroke:d??w,className:v(N,h),hasA11yProp:z,attributes:g});return a.createElement(A,{ref:k,...W},[...$.map(([E,B])=>a.createElement(E,B)),...Array.isArray(u)?u:[u]])});/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function C(t,e=[],o=[]){const s=typeof t=="string"?D(t,e,o):t,c=a.forwardRef(({className:l,...d},h)=>a.createElement(U,{ref:h,icon:s,className:l,...d}));return s.name&&(c.displayName=P(s.name)),c}/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j={name:"check",size:24,node:[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]};j.node;const H=C(j);/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S={name:"chevron-down",size:24,node:[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]};S.node;const K=C(S);/**
 * @license lucide-react v1.45.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L={name:"globe",size:24,node:[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]};L.node;const Z=C(L),T=({compact:t=!1})=>{const{language:e,setLanguage:o,languages:s}=I(),[c,l]=a.useState(!1),d=a.useRef(null),h=s.find(n=>n.code===e)||s[1];a.useEffect(()=>{const n=x=>{d.current&&!d.current.contains(x.target)&&l(!1)};return document.addEventListener("mousedown",n),()=>document.removeEventListener("mousedown",n)},[]);const u=n=>{o(n),l(!1)};return i.jsxs("div",{className:"relative inline-block text-left",ref:d,children:[i.jsxs("button",{type:"button",onClick:()=>l(!c),"aria-label":"Select Language","aria-expanded":c,className:`inline-flex items-center gap-2 rounded-xl border border-earth-300/80 bg-white/95 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-earth-50 focus:outline-none focus:ring-2 focus:ring-krishi-500 transition-colors ${t?"px-2 py-1.5 text-xs":"px-3.5 py-2"}`,children:[i.jsx(Z,{className:"h-4 w-4 text-krishi-700"}),i.jsx("span",{className:"font-semibold",children:h.nativeName}),!t&&i.jsxs("span",{className:"text-gray-400 text-xs",children:["(",h.name,")"]}),i.jsx(K,{className:`h-3.5 w-3.5 text-gray-500 transition-transform ${c?"rotate-180":""}`})]}),c&&i.jsxs("div",{className:"absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white p-1.5 shadow-soft-lg ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-1",children:[i.jsx("div",{className:"px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100",children:"Select Language (भाषा)"}),i.jsx("div",{className:"py-1",children:s.map((n,x)=>{const g=n.code===e;return i.jsxs("button",{onClick:()=>u(n.code),className:`flex w-full items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${g?"bg-krishi-50 text-krishi-900 font-semibold":"text-gray-700 hover:bg-earth-100 hover:text-gray-900"}`,children:[i.jsxs("div",{className:"flex items-center gap-2.5",children:[i.jsxs("span",{className:"text-xs text-gray-400 w-4 font-mono",children:[x+1,"."]}),i.jsxs("div",{children:[i.jsx("div",{className:"text-sm font-medium",children:n.name}),i.jsx("div",{className:"text-xs text-gray-500",children:n.nativeName})]})]}),g&&i.jsx(H,{className:"h-4 w-4 text-krishi-600"})]},n.code)})})]})]})};export{H as C,Z as G,T as L,K as a,C as c};
