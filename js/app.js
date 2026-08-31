(function () {
  "use strict";
  let D;
  const fields = {
    newGuarantee: { label: "신규보증 실행", unit: "백만원", color: "#1769aa" },
    accidents: { label: "사고발생 순증", unit: "백만원", color: "#43a8c5" },
    accidentRate: { label: "사고발생 순증률", unit: "%", color: "#2f7ea9" },
    balance: { label: "보증잔액", unit: "백만원", color: "#305b88" }
  };
  let category = "district", metric = "newGuarantee", monthIndex = 0;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const fmt = (n, decimal = false) => Number(n).toLocaleString("ko-KR", { maximumFractionDigits: decimal ? 1 : 0 });
  const monthly = () => D.monthly[monthIndex];

  async function init() {
    try {
      const response = await fetch("data/dashboard-data.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      D = await response.json();
      validateData(D);
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
      showLoadError();
      return;
    }
    monthIndex = D.monthly.length - 1;
    updatePeriodLabels();
    if ($("#composition-period")) $("#composition-period").textContent = `${D.meta.periodLabel} · 부산시 전체`;
    if ($("#updated-label")) $("#updated-label").textContent = `최근 업데이트 ${D.meta.updatedAt.replaceAll("-", ".")}`;
    D.monthly.forEach((m, i) => {
      const optionLabel = m.period ? `${m.period.slice(0, 4)}년 ${Number(m.period.slice(5))}월` : `${D.meta.year}년 ${m.label}`;
      $("#month-select").add(new Option(optionLabel, i));
    });
    $("#month-select").value = monthIndex;
    $("#metric-switch").innerHTML = Object.entries(fields).map(([key, x]) => `<button data-metric="${key}" class="${key === metric ? "active" : ""}">${x.label}</button>`).join("");
    bind(); renderAll();
  }

  function validateData(data) {
    const groups = ["monthly", "district", "age", "industry"];
    if (!data?.meta || groups.some(key => !Array.isArray(data[key]) || data[key].length === 0)) {
      throw new Error("필수 데이터 항목이 없거나 비어 있습니다.");
    }
  }

  function showLoadError() {
    $("#kpi-grid").innerHTML = `<article class="panel" style="grid-column:1/-1"><h3>데이터를 불러오지 못했습니다.</h3><p>정적 웹 서버에서 실행 중인지와 <code>data/dashboard-data.json</code> 파일 형식을 확인해 주세요.</p></article>`;
  }

  function bind() {
    $("#month-select").addEventListener("change", e => { monthIndex = +e.target.value; updatePeriodLabels(); renderAll(); });
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

  function updatePeriodLabels() {
    const item = monthly();
    const label = item.period ? `${item.period.slice(0, 4)}년 ${Number(item.period.slice(5))}월` : `${D.meta.year}년 ${item.label}`;
    $("#period-label").textContent = `${label} 기준`;
    if ($("#notice-period")) $("#notice-period").textContent = `${label} 말`;
  }

  function renderAll() { renderKpis(); renderCompositions(); renderTrend(); renderGauge(); renderBreakdown(); }
  function renderKpis() {
    const now = monthly(), prev = D.monthly[Math.max(0, monthIndex - 1)];
    $("#kpi-grid").innerHTML = Object.entries(fields).map(([key, x], i) => {
      const diff = now[key] - prev[key], pct = prev[key] ? diff / prev[key] * 100 : 0, cls = diff >= 0 ? "up" : "down";
      const period = now.period ? `${now.period.slice(0,4)}.${now.period.slice(5)}` : `${D.meta.year}.${String(monthIndex + 1).padStart(2,"0")}`;
      return `<article class="kpi-card" style="--accent:${x.color}"><div class="kpi-label"><span>${x.label}</span><span class="kpi-period">${period}</span></div><div class="kpi-value">${fmt(now[key], key === "accidentRate")}<small>${x.unit}</small></div><div class="delta"><span>전월 대비</span><b class="${cls}">${diff >= 0 ? "▲" : "▼"} ${fmt(Math.abs(pct), true)}%</b></div></article>`;
    }).join("");
  }
  function renderCompositions() {
    renderDonut("#balance-age-chart", D.age, 6);
    renderDonut("#balance-industry-chart", D.industry, 6);
    renderDonut("#balance-tenure-chart", D.tenure, 6);
  }
  function renderDonut(selector, source, limit) {
    const palette=["#24469a","#2f83ec","#39afe0","#ff7514","#f2a007","#687b91"];
    const ordered=[...source].filter(r=>Number(r.balance)>0).sort((a,b)=>b.balance-a.balance);
    const total=ordered.reduce((sum,r)=>sum+Number(r.balance),0);
    let rows=ordered;
    if(ordered.length>limit){
      const head=ordered.slice(0,limit-1), other=ordered.slice(limit-1).reduce((sum,r)=>sum+Number(r.balance),0);
      rows=[...head,{label:"기타",balance:other}];
    }
    let cursor=0;
    const gradient=rows.map((r,i)=>{const start=cursor;cursor+=r.balance/total*100;return `${palette[i%palette.length]} ${start}% ${cursor}%`}).join(",");
    const lead=rows[0];
    $(selector).innerHTML=`<div class="donut-visual"><div class="donut-ring" style="background:conic-gradient(${gradient})"><div class="donut-center"><span>보증잔액</span><b>${fmt(total,true)}</b><small>백만원</small></div></div></div><div class="donut-lead"><b>${lead.label}</b><span>${fmt(lead.balance/total*100,true)}% · ${fmt(lead.balance,true)}백만원</span></div><ul class="donut-list">${rows.map((r,i)=>`<li><i style="background:${palette[i%palette.length]}"></i><span>${r.label}</span><b>${fmt(r.balance/total*100,true)}%</b><small>${fmt(r.balance,true)}</small></li>`).join("")}</ul>`;
  }
  function renderTrend() {
    const data=D.monthly,W=980,H=330,p={l:64,r:64,t:22,b:38},maxNew=Math.max(...data.map(x=>x.newGuarantee))*1.08,maxAcc=Math.max(...data.map(x=>x.accidents))*1.08,step=(W-p.l-p.r)/(data.length-1),plotH=H-p.t-p.b;
    const point=(d,i,key,max)=>({x:p.l+i*step,y:p.t+plotH*(1-d[key]/max)});
    const path=(key,max)=>data.map((d,i)=>{const q=point(d,i,key,max);return `${i?"L":"M"}${q.x.toFixed(2)},${q.y.toFixed(2)}`}).join(" ");
    const grid=[0,.25,.5,.75,1].map(t=>{const y=p.t+plotH*(1-t);return `<line class="grid-line" x1="${p.l}" y1="${y}" x2="${W-p.r}" y2="${y}"/><text class="axis-label" x="${p.l-10}" y="${y+4}" text-anchor="end">${fmt(maxNew*t)}</text><text class="axis-label axis-right" x="${W-p.r+10}" y="${y+4}">${fmt(maxAcc*t)}</text>`}).join("");
    const labels=data.map((d,i)=>{if(i!==0&&i!==data.length-1&&!d.period.endsWith("-01"))return "";const q=point(d,i,"newGuarantee",maxNew);return `<text class="axis-label year-label" x="${q.x}" y="${H-11}" text-anchor="middle">${d.period.slice(0,4)}</text>`}).join("");
    const hits=data.map((d,i)=>{const q1=point(d,i,"newGuarantee",maxNew),q2=point(d,i,"accidents",maxAcc);return `<g class="trend-hit ${i===monthIndex?"selected":""}" data-index="${i}"><line x1="${q1.x}" y1="${p.t}" x2="${q1.x}" y2="${H-p.b}"/><circle class="point-main" cx="${q1.x}" cy="${q1.y}" r="3"/><circle class="point-sub" cx="${q2.x}" cy="${q2.y}" r="3"/><rect x="${q1.x-step/2}" y="${p.t}" width="${Math.max(step,8)}" height="${plotH}"/></g>`}).join("");
    $("#trend-chart").innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${grid}<path class="trend-line-main" d="${path("newGuarantee",maxNew)}"/><path class="trend-line-sub" d="${path("accidents",maxAcc)}"/>${labels}${hits}</svg><div class="chart-tooltip" aria-hidden="true"></div>`;
    const tooltip=$("#trend-chart .chart-tooltip");
    $$("#trend-chart .trend-hit").forEach(hit=>{hit.addEventListener("pointerenter",()=>{const d=data[+hit.dataset.index];tooltip.innerHTML=`<b>${d.period.slice(0,4)}년 ${Number(d.period.slice(5))}월</b><span>신규보증 실행 <strong>${fmt(d.newGuarantee,true)}</strong> 백만원</span><span>사고발생 순증 <strong>${fmt(d.accidents,true)}</strong> 백만원</span>`;tooltip.classList.add("show");hit.classList.add("active")});hit.addEventListener("pointermove",e=>{const box=$("#trend-chart").getBoundingClientRect();tooltip.style.left=`${Math.min(e.clientX-box.left+12,box.width-205)}px`;tooltip.style.top=`${Math.max(e.clientY-box.top-82,8)}px`});hit.addEventListener("pointerleave",()=>{tooltip.classList.remove("show");hit.classList.remove("active")})});
  }
  function renderGauge() {
    const rate=monthly().accidentRate, degree=Math.min(rate/10*360,360);
    $("#rate-chart").innerHTML=`<div class="gauge"><div class="gauge-ring" style="background:conic-gradient(var(--blue) ${degree}deg,#e9eff2 ${degree}deg)"><div class="gauge-value">${fmt(rate,true)}<small>%</small></div></div><p>연간환산 사고발생 순증률</p></div>`;
  }
  function normalizedRows() { return D[category]; }
  function renderBreakdown() {
    $$("#metric-switch button").forEach(b => b.classList.toggle("active", b.dataset.metric === metric));
    const query=$("#table-search").value.trim(), rows=normalizedRows().filter(r=>r.label.includes(query)).sort((a,b)=>b[metric]-a[metric]), max=Math.max(...rows.map(r=>r[metric]),1), info=fields[metric];
    const distribution=category==="age"||category==="tenure";
    $("#ranking-chart").className=`ranking-chart ${distribution?"distribution-chart":"ranking-mode"}`;
    $("#ranking-chart").innerHTML=distribution?rows.map(r=>`<div class="distribution-item"><span class="distribution-value">${fmt(r[metric],metric==="accidentRate")}</span><div class="distribution-track"><i style="height:${r[metric]/max*100}%"></i></div><span class="distribution-label">${r.label}</span></div>`).join(""):rows.slice(0,10).map((r,i)=>`<div class="rank-row"><span class="rank-index">${String(i+1).padStart(2,"0")}</span><span class="rank-name">${r.label}</span><div class="bar-track"><div class="bar-fill" style="width:${r[metric]/max*100}%"></div></div><span class="rank-value">${fmt(r[metric],metric==="accidentRate")}${info.unit}</span></div>`).join("")||"검색 결과가 없습니다.";
    $("#data-table").innerHTML=rows.map(r=>`<tr><td>${r.label}</td><td>${fmt(r.newGuarantee)}</td><td>${fmt(r.accidents)}</td><td>${fmt(r.accidentRate,true)}%</td><td>${fmt(r.balance)}</td></tr>`).join("");
  }
  function downloadCsv() {
    const head=["구분","신규보증 실행(백만원)","사고발생 순증(백만원)","사고발생 순증률(%)","보증잔액(백만원)"], rows=normalizedRows().map(r=>[r.label,r.newGuarantee,r.accidents,r.accidentRate,r.balance]);
    const csv="\ufeff"+[head,...rows].map(r=>r.join(",")).join("\n"), blob=new Blob([csv],{type:"text/csv;charset=utf-8"}), url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url;a.download=`보증통계_${category}_${D.meta.updatedAt}.csv`;a.click();URL.revokeObjectURL(url);
  }
  init();
})();
