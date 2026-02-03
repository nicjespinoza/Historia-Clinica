import{j as t,q as u,r as w}from"./ui-DQFPLK17.js";import{c as l}from"./utils-CDN07tui.js";import{r as i,R as j}from"./vendor-CGaW2js3.js";/**
 * @license @tabler/icons-react v3.35.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */var M={outline:{xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},filled:{xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"currentColor",stroke:"none"}};/**
 * @license @tabler/icons-react v3.35.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=(e,a,s,o)=>{const n=i.forwardRef(({color:r="currentColor",size:d=24,stroke:h=2,title:v,className:g,children:p,...b},y)=>i.createElement("svg",{ref:y,...M[e],width:d,height:d,className:["tabler-icon",`tabler-icon-${a}`,g].join(" "),strokeWidth:h,stroke:r,...b},[v&&i.createElement("title",{key:"svg-title"},v),...o.map(([f,k])=>i.createElement(f,k)),...Array.isArray(p)?p:[p]]));return n.displayName=`${s}`,n};/**
 * @license @tabler/icons-react v3.35.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["path",{d:"M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z",key:"svg-0"}],["path",{d:"M16 3v4",key:"svg-1"}],["path",{d:"M8 3v4",key:"svg-2"}],["path",{d:"M4 11h16",key:"svg-3"}],["path",{d:"M11 15h1",key:"svg-4"}],["path",{d:"M12 15v3",key:"svg-5"}]],A=c("outline","calendar","Calendar",N);/**
 * @license @tabler/icons-react v3.35.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2",key:"svg-0"}],["path",{d:"M9 12h12l-3 -3",key:"svg-1"}],["path",{d:"M18 15l3 -3",key:"svg-2"}]],P=c("outline","logout","Logout",C);/**
 * @license @tabler/icons-react v3.35.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"M4 6l16 0",key:"svg-0"}],["path",{d:"M4 12l16 0",key:"svg-1"}],["path",{d:"M4 18l16 0",key:"svg-2"}]],_=c("outline","menu-2","Menu2",S);/**
 * @license @tabler/icons-react v3.35.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=[["path",{d:"M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0",key:"svg-0"}],["path",{d:"M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2",key:"svg-1"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"svg-2"}],["path",{d:"M21 21v-2a4 4 0 0 0 -3 -3.85",key:"svg-3"}]],U=c("outline","users","Users",E);/**
 * @license @tabler/icons-react v3.35.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=[["path",{d:"M18 6l-12 12",key:"svg-0"}],["path",{d:"M6 6l12 12",key:"svg-1"}]],L=c("outline","x","X",I),m=i.createContext(void 0),x=()=>{const e=i.useContext(m);if(!e)throw new Error("useSidebar must be used within a SidebarProvider");return e},$=({children:e,open:a,setOpen:s,animate:o=!0})=>{const[n,r]=i.useState(!1),d=a!==void 0?a:n,h=s!==void 0?s:r;return t.jsx(m.Provider,{value:{open:d,setOpen:h,animate:o},children:e})},W=({children:e,open:a,setOpen:s,animate:o})=>t.jsx($,{open:a,setOpen:s,animate:o,children:e}),X=e=>t.jsxs(t.Fragment,{children:[t.jsx(O,{...e}),t.jsx(R,{...e})]}),O=({className:e,children:a,...s})=>{const{open:o,setOpen:n,animate:r}=x();return t.jsx(t.Fragment,{children:t.jsx(u.div,{className:l("h-full px-4 py-4 hidden md:flex md:flex-col bg-white w-[300px] flex-shrink-0 border-r border-gray-200 shadow-xl shadow-blue-900/5",e),animate:{width:r?o?"300px":"80px":"300px"},onMouseEnter:()=>n(!0),onMouseLeave:()=>n(!1),...s,children:a})})},R=({className:e,children:a,...s})=>{const{open:o,setOpen:n}=x();return t.jsx(t.Fragment,{children:t.jsxs("div",{className:l("h-16 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-white border-b border-gray-100 w-full shadow-sm"),...s,children:[t.jsx("div",{className:"flex justify-end z-20 w-full",children:t.jsx(_,{className:"text-gray-700",onClick:()=>n(!o)})}),t.jsx(w,{children:o&&t.jsxs(u.div,{initial:{x:"-100%",opacity:0},animate:{x:0,opacity:1},exit:{x:"-100%",opacity:0},transition:{duration:.3,ease:"easeInOut"},className:l("fixed h-full w-full inset-0 bg-white p-10 z-[100] flex flex-col justify-between shadow-2xl",e),children:[t.jsx("div",{className:"absolute right-10 top-10 z-50 text-gray-700",onClick:()=>n(!o),children:t.jsx(L,{})}),a]})})]})})},q=({link:e,className:a,isActive:s,...o})=>{const{open:n,animate:r}=x();return t.jsxs("div",{onClick:e.onClick,className:l("flex items-center justify-start gap-2 group/sidebar py-2 cursor-pointer hover:bg-blue-50 rounded-lg px-2 transition-colors",s&&"bg-[#083c79]/10",a),...o,children:[s?j.cloneElement(e.icon,{className:l(e.icon.props.className,"!text-[#083c79]")}):e.icon,t.jsx(u.span,{animate:{display:r?n?"inline-block":"none":"inline-block",opacity:r?n?1:0:1},className:l("font-bold text-sm group-hover/sidebar:text-blue-600 transition duration-150 whitespace-pre inline-block !p-0 !m-0",s?"text-[#083c79] font-bold":"text-black"),children:e.label})]})};export{U as I,W as S,X as a,q as b,c,A as d,P as e};
