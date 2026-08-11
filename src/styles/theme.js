/* ============================================================================
   Design tokens — single stylesheet, terminal palette
   ========================================================================== */

export const STYLES = `
:root{
  --bg:#0B0B0C; --panel:#121214; --panel-2:#17171A; --sunken:#0E0E10;
  --line:#26262B; --line-2:#34343B;
  --tx:#EDEAE4; --dim:#8E8E96; --dimmer:#5C5C64;
  --green:#4FA37A; --green-dim:#2C5C46; --green-wash:#12211B;
  --amber:#C69A4C; --amber-wash:#1F1A10;
  --red:#B4574F; --red-wash:#1E1211;
}
.cold-root{background:var(--bg);color:var(--tx);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;}
.mono{font-family:ui-monospace,"SF Mono","JetBrains Mono","IBM Plex Mono",Menlo,Consolas,monospace;
  font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;}
.panel{background:var(--panel);border:1px solid var(--line);}
.sunken{background:var(--sunken);border:1px solid var(--line);}
.hair{border-color:var(--line);}
.label{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--dimmer);}
.eyebrow{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--dim);}
.dim{color:var(--dim);} .dimmer{color:var(--dimmer);}
.green{color:var(--green);} .amber{color:var(--amber);} .red{color:var(--red);}
.btn{font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.06em;
  background:var(--panel-2);border:1px solid var(--line-2);color:var(--tx);
  padding:8px 14px;cursor:pointer;transition:border-color .15s,background .15s;}
.btn:hover{border-color:var(--dim);background:#1D1D21;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.btn-primary{background:var(--green-wash);border-color:var(--green-dim);color:var(--green);}
.btn-primary:hover:enabled{background:#16291F;border-color:var(--green);}
.btn-sel{background:var(--green-wash);border-color:var(--green);color:var(--green);}
.input{background:var(--sunken);border:1px solid var(--line);color:var(--tx);
  font-family:ui-monospace,Menlo,monospace;font-size:13px;padding:8px 10px;width:100%;outline:none;}
.input:focus{border-color:var(--green-dim);}
.input::placeholder{color:var(--dimmer);}
.term{border-bottom:1px dashed var(--dim);cursor:help;color:var(--tx);}
.term:hover{color:var(--green);border-color:var(--green);}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;cursor:pointer;
  border-left:2px solid transparent;font-size:13px;color:var(--dim);}
.nav-item:hover{color:var(--tx);background:var(--panel-2);}
.nav-item.active{color:var(--tx);background:var(--panel-2);border-left-color:var(--green);}
.rng{-webkit-appearance:none;appearance:none;width:100%;height:2px;background:var(--line-2);outline:none;}
.rng::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:var(--tx);
  border:1px solid var(--bg);cursor:pointer;border-radius:0;}
.rng::-moz-range-thumb{width:14px;height:14px;background:var(--tx);border:1px solid var(--bg);
  cursor:pointer;border-radius:0;}
.rowline{border-top:1px solid var(--line);}
table.fin{width:100%;border-collapse:collapse;}
table.fin td,table.fin th{padding:7px 10px;border-bottom:1px solid var(--line);font-size:13px;}
table.fin th{font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--dimmer);text-align:right;font-weight:400;}
table.fin th:first-child{text-align:left;}
table.fin tr:hover td{background:var(--panel-2);}
.scrollx{overflow-x:auto;}
*:focus-visible{outline:1px solid var(--green);outline-offset:2px;}
@media (prefers-reduced-motion: reduce){*{transition:none !important;animation:none !important;}}
`;
