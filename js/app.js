(function () {
  "use strict";
  const D = window.DASHBOARD_DATA;
  const fields = {
    newGuarantee: { label: "신규보증", unit: "억원", color: "#196bb7" },
    accidents: { label: "사고발생", unit: "억원", color: "#e77761" },
    accidentRate: { label: "사고발생 순증률", unit: "%", color: "#11a58b" },
    balance: { label: "보증잔액", unit: "억원", color: "#664fc1" }
  };
  let category = "district", metric = "newGuarantee", monthIndex = D.monthly.length - 1;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const fmt = (n, decimal = false) => Number(n).toLocaleString("ko-KR", { maximumFractionDigits: decimal ? 1 : 0 });
  const monthly = () => D.monthly[monthIndex];

  function init() {
    $("#period-label").textContent = D.meta.periodLabel;
    D.monthly.forEach((m, i) => $("#month-select").add(new Option(`2026년 ${m.label}`, i)));
    $("#month-select").value = monthIndex;
    $("#metric-switch").innerHTML = Object.entries(fields).map(([key, x]) => `<button data-metric="${key}" class="${key === metric ? "active" : ""}">${x.label}</button>`).join("");
    bind(); renderAll();
  }

  function bind() {
    $("#month-select").addEventListener("change", e => { monthIndex = +e.target.value; renderAll(); });
    $$(".tabs button").forEach(b => b.addEventListener("click", () => {
      category = b.dataset.category; $$(".tabs button").forEach(x => x.setAttribute("aria-selected", x === b)); renderBreakdown();
    }));
    $("#metric-switch").addEventListener("click", e => { if (!e.target.dataset.metric) return; metric = e.target.dataset.metric; renderBreakdown(); });
    $("#table-search").addEventListener("input", renderBreakdown);
    $("#download-btn").addEventListener("click", downloadCsv);
    $(".menu-toggle").addEventListener("click", e => { const open = $("nav").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", open); });
    $$(".nav-item").forEach(b => b.addEventListener("click", () => {
      $$(".nav-item").forEach(x => x.classList.toggle("active", x === b));
      const names = { overview:"보증 종합현황", guarantee:"보증현황분석", accident:"사고율 분석" };
      $("#page-title").textContent = names[b.dataset.page];
      if (b.dataset.page === "guarantee") { metric = "newGuarantee"; document.querySelector(".breakdown-section").scrollIntoView(); }
      if (b.dataset.page === "accident") { metric = "accidentRate"; document.querySelector(".breakdown-section").scrollIntoView(); }
      renderBreakdown();
    }));
  }

  function renderAll() { renderKpis(); renderTrend(); renderGauge(); renderBreakdown(); }
  function renderKpis() {
    const now = monthly(), prev = D.monthly[Math.max(0, monthIndex - 1)];
    $("#kpi-grid").innerHTML = Object.entries(fields).map(([key, x], i) => {
      const diff = now[key] - prev[key], pct = prev[key] ? diff / prev[key] * 100 : 0, cls = diff >= 0 ? "up" : "down";
      return `<article class="kpi-card" style="--accent:${x.color}"><div class="kpi-label"><span>${x.label}</span><span class="kpi-icon">${["＋","!","↗","▤"][i]}</span></div><div class="kpi-value">${fmt(now[key], key === "accidentRate")}<small>${x.unit}</small></div><div class="delta">전월 대비 <b class="${cls}">${diff >= 0 ? "▲" : "▼"} ${fmt(Math.abs(pct), true)}%</b></div></article>`;
    }).join("");
  }
  function renderTrend() {
    const data = D.monthly.slice(0, monthIndex + 1), W=760,H=230,p={l:42,r:15,t:15,b:30}, max=Math.max(...data.map(x=>x.newGuarantee))*1.15, step=(W-p.l-p.r)/data.length;
    const grid=[0,.25,.5,.75,1].map(t=>`<line class="grid-line" x1="${p.l}" y1="${p.t+(H-p.t-p.b)*(1-t)}" x2="${W-p.r}" y2="${p.t+(H-p.t-p.b)*(1-t)}"/><text class="axis-label" x="${p.l-8}" y="${p.t+(H-p.t-p.b)*(1-t)+4}" text-anchor="end">${fmt(max*t)}</text>`).join("");
    const bars=data.map((d,i)=>{const x=p.l+i*step+step*.2,h1=(H-p.t-p.b)*d.newGuarantee/max,h2=(H-p.t-p.b)*(d.accidents*6)/max;return `<rect class="bar-main" x="${x}" y="${H-p.b-h1}" width="${step*.26}" height="${h1}" rx="3"/><rect class="bar-sub" x="${x+step*.3}" y="${H-p.b-h2}" width="${step*.18}" height="${h2}" rx="3"/><text class="axis-label" x="${x+step*.23}" y="${H-9}" text-anchor="middle">${d.label}</text>`}).join("");
    $("#trend-chart").innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${grid}${bars}</svg>`;
  }
  function renderGauge() {
    const rate=monthly().accidentRate, degree=Math.min(rate/10*360,360);
    $("#rate-chart").innerHTML=`<div class="gauge"><div class="gauge-ring" style="background:conic-gradient(var(--mint) ${degree}deg,#e9eff2 ${degree}deg)"><div class="gauge-value">${fmt(rate,true)}<small>%</small></div></div><p>신규보증 대비 사고발생 비율</p></div>`;
  }
  function normalizedRows() { return D[category].map(r => ({ label:r[0], newGuarantee:r[1], accidents:r[2], accidentRate:r[3], balance:r[4] })); }
  function renderBreakdown() {
    $$("#metric-switch button").forEach(b => b.classList.toggle("active", b.dataset.metric === metric));
    const query=$("#table-search").value.trim(), rows=normalizedRows().filter(r=>r.label.includes(query)).sort((a,b)=>b[metric]-a[metric]), max=Math.max(...rows.map(r=>r[metric]),1), info=fields[metric];
    $("#ranking-chart").innerHTML=rows.slice(0,10).map((r,i)=>`<div class="rank-row"><span class="rank-name">${String(i+1).padStart(2,"0")} ${r.label}</span><div class="bar-track"><div class="bar-fill" style="width:${r[metric]/max*100}%;background:${info.color}"></div></div><span class="rank-value">${fmt(r[metric],metric==="accidentRate")}${info.unit}</span></div>`).join("") || "검색 결과가 없습니다.";
    $("#data-table").innerHTML=rows.map(r=>`<tr><td>${r.label}</td><td>${fmt(r.newGuarantee)}</td><td>${fmt(r.accidents)}</td><td>${fmt(r.accidentRate,true)}%</td><td>${fmt(r.balance)}</td></tr>`).join("");
  }
  function downloadCsv() {
    const head=["구분","신규보증(억원)","사고발생(억원)","사고발생 순증률(%)","보증잔액(억원)"], rows=normalizedRows().map(r=>[r.label,r.newGuarantee,r.accidents,r.accidentRate,r.balance]);
    const csv="\ufeff"+[head,...rows].map(r=>r.join(",")).join("\n"), blob=new Blob([csv],{type:"text/csv;charset=utf-8"}), url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url;a.download=`보증통계_${category}_${D.meta.updatedAt}.csv`;a.click();URL.revokeObjectURL(url);
  }
  init();
})();
