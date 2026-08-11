/* ============================================================================
   Shell layout CSS — sidebar, responsive split grids
   ========================================================================== */

export const SHELL_CSS = `
.shell{display:grid;grid-template-columns:216px minmax(0,1fr);min-height:100vh;}
.side{border-right:1px solid var(--line);background:var(--panel);position:sticky;top:0;height:100vh;overflow-y:auto;}
.side-mobile{display:none;}
.split-a{display:grid;gap:20px;grid-template-columns:minmax(0,2fr) minmax(260px,1fr);}
.split-b{display:grid;gap:20px;grid-template-columns:minmax(260px,1fr) minmax(0,2fr);}
.split-c{display:grid;gap:20px;grid-template-columns:minmax(0,3fr) minmax(240px,1fr);}
.split-d{display:grid;gap:24px;grid-template-columns:minmax(0,1fr) minmax(240px,auto);}
@media (max-width: 980px){
  .shell{grid-template-columns:minmax(0,1fr);}
  .side{display:none;}
  .side-mobile{display:block;position:sticky;top:0;z-index:40;background:var(--panel);
    border-bottom:1px solid var(--line);overflow-x:auto;white-space:nowrap;}
  .split-a,.split-b,.split-c,.split-d{grid-template-columns:minmax(0,1fr);}
}
`;
