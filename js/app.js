(function () {
  "use strict";

  let D, H, X;
  const fields = {
    newGuarantee: { label: "신규보증 실행", amount: "new_guarantee_amount", count: "new_guarantee_count", unit: "백만원", color: "#1769aa" },
    balance: { label: "보증잔액", amount: "guarantee_balance_amount", count: "guarantee_balance_count", unit: "백만원", color: "#305b88" },
    accidents: { label: "사고발생 순증", amount: "accident_net_amount", count: "accident_net_count", unit: "백만원", color: "#43a8c5" },
    accidentRate: { label: "연간환산 사고발생 순증률", amount: "accidentRate", unit: "%", color: "#d85959" }
  };
  const dimensions = { district: "구·군", industry: "업종", age: "연령대", tenure: "업력" };
  const districtShapes = [
    { name: "강서구", path: "M101 615L94 596L85 582L59 578L33 562L18 531L18 525L22 521L33 518L51 518L62 522L71 529L76 529L111 520L122 508L128 505L156 506L177 513L202 512L205 508L205 498L202 492L191 482L189 448L171 427L194 403L227 398L242 376L260 377L265 391L273 393L305 379L324 383L344 383L367 378L395 369L414 359L413 376L408 394L411 434L408 437L373 450L358 459L350 515L348 550L343 576L329 591L328 599L318 604L298 622L293 623L273 646L269 670L262 681L242 687L231 687L226 682L220 649L234 614L233 606L226 604L211 604L209 606L199 633L194 685L191 691L182 698L175 697L168 681L164 681L159 686L155 696L134 695L118 692L71 674L65 671L63 667L69 645L107 640L110 623Z", label: [228, 532] },
    { name: "북구", path: "M411 396L416 372L416 357L428 351L435 344L441 319L450 304L459 295L458 267L463 263L517 255L517 263L507 276L502 288L503 298L522 335L522 342L515 355L515 364L541 382L539 394L524 422L513 431L489 443L465 453L454 454L413 436Z", label: [473, 366] },
    { name: "금정구", path: "M535 239L550 222L591 219L630 201L648 190L651 190L684 214L684 239L671 266L670 285L675 291L698 294L703 307L717 322L710 328L707 338L699 346L694 359L671 372L666 397L659 400L655 405L646 407L636 400L631 388L624 381L596 380L582 370L570 370L543 381L536 374L518 364L518 354L525 342L525 336L505 296L505 287L510 276L519 265L519 255L525 252Z", label: [609, 299] },
    { name: "기장군", path: "M850 455L847 444L831 433L818 437L809 450L805 451L797 425L790 415L761 419L750 412L750 408L759 399L763 382L763 365L758 358L757 351L744 332L725 324L715 316L705 305L699 291L674 287L674 265L686 241L688 218L680 207L665 199L653 187L662 162L668 157L681 137L688 105L700 90L700 83L688 73L690 68L711 63L733 63L746 78L758 84L774 89L794 89L821 74L825 67L827 52L833 44L833 38L818 25L823 14L842 18L856 33L864 36L923 25L951 17L963 18L969 23L970 30L978 44L998 62L995 79L1002 92L997 107L999 116L1013 131L1039 144L1037 162L1041 166L1035 169L1014 167L1006 163L993 150L984 163L967 164L961 167L958 183L958 227L947 236L947 240L955 244L955 256L942 275L918 282L909 293L909 300L912 305L922 307L933 298L937 307L935 343L919 359L917 366L918 390L899 382L895 395L885 407L884 415L893 416L896 421L898 435L895 440L883 441L872 460L863 468L853 465Z", label: [835, 213] },
    { name: "사상구", path: "M432 577L424 602L417 607L415 615L402 611L391 611L382 616L370 618L339 604L330 596L332 591L344 580L347 571L360 461L375 452L411 438L416 442L433 447L451 456L459 456L462 459L454 488L455 506L461 522L459 549L452 563L434 567Z", label: [400, 528] },
    { name: "부산진구", path: "M529 462L533 467L550 469L562 483L572 483L583 487L587 497L585 514L588 519L595 522L593 527L581 539L553 547L549 553L542 557L531 557L525 553L506 554L494 569L481 576L455 564L461 551L464 531L464 523L456 497L457 485L464 463L463 456L512 435Z", label: [514, 507] },
    { name: "동래구", path: "M525 423L536 406L545 383L563 375L578 372L593 382L624 384L633 400L641 407L651 411L653 441L652 445L627 440L604 444L599 442L591 432L581 431L569 436L548 451L534 452L524 447L514 435L514 432L518 431Z", label: [584, 414] },
    { name: "연제구", path: "M527 454L525 451L535 455L550 453L569 439L586 433L601 446L629 443L652 447L659 474L645 475L633 488L625 490L621 495L617 521L603 521L589 516L587 510L590 506L590 499L584 484L562 480L553 468L534 465Z", label: [600, 470], small: true },
    { name: "해운대구", path: "M681 370L695 362L702 346L710 338L713 328L719 323L741 333L753 349L761 368L758 393L755 401L747 408L747 412L759 421L788 417L795 427L804 454L809 453L816 443L825 436L837 439L845 446L849 464L856 470L827 479L822 487L822 512L814 518L802 521L783 536L765 526L753 526L748 528L738 539L720 541L708 530L692 530L684 498L664 478L655 453L653 408L670 396L672 376L674 372Z", label: [737, 447] },
    { name: "수영구", path: "M646 562L633 553L628 530L625 525L619 523L620 510L623 506L625 493L635 490L642 480L647 477L661 476L663 481L680 496L686 513L688 530L670 533L665 540L660 558L653 564Z", label: [652, 517], small: true },
    { name: "남구", path: "M624 528L631 554L646 566L652 566L660 579L668 580L673 584L681 612L689 620L682 650L673 658L660 659L652 653L647 645L642 646L636 656L625 656L620 651L621 637L615 629L600 628L584 634L575 634L564 629L559 610L545 610L544 608L550 603L552 597L552 571L547 556L551 555L555 549L581 542L594 530L599 522L612 523Z", label: [616, 594] },
    { name: "동구", path: "M474 595L476 583L484 576L497 570L506 557L523 555L532 560L546 559L549 569L549 599L541 606L544 612L537 616L535 620L507 614L485 614L479 607L473 606Z", label: [514, 588], small: true },
    { name: "중구", path: "M482 620L486 616L498 616L533 622L537 645L532 650L527 664L514 668L488 668L483 670L478 658L467 645L471 629Z", label: [502, 642], small: true },
    { name: "서구", path: "M465 744L452 752L445 746L441 714L459 700L457 671L455 666L446 660L441 629L433 623L418 620L418 611L427 602L429 591L435 579L436 569L450 565L478 578L473 583L470 606L478 609L483 615L481 619L470 626L464 640L466 648L475 658L482 672L476 682L480 695L480 705L463 716L467 742Z", label: [455, 643], small: true },
    { name: "사하구", path: "M455 679L456 700L443 711L441 711L442 693L437 690L419 688L408 702L409 715L424 736L427 775L421 778L412 777L407 773L408 760L405 756L393 753L383 754L374 762L371 788L358 792L350 780L347 768L341 758L337 665L334 642L328 637L319 640L304 688L294 688L290 684L290 678L298 624L310 616L318 607L329 601L367 620L378 620L393 613L414 617L416 622L431 625L438 629L443 660L453 667Z", label: [376, 683] },
    { name: "영도구", path: "M547 724L537 716L494 693L493 679L487 671L526 668L529 666L538 646L550 653L593 698L597 725L604 735L620 748L620 752L612 768L596 766L561 744L557 740L554 730Z", label: [558, 706] }
  ];
  const pageMetrics = { guarantee: ["newGuarantee", "balance"], accident: ["accidents", "accidentRate"] };
  const pageMetricState = { guarantee: "newGuarantee", accident: "accidents" };
  const externalSeries = {
    smallBusinessBsi: { label: "부산 소상공인 체감경기 BSI", shortLabel: "부산 소상공인 BSI", frequency: "monthly", unit: "지수", deltaUnit: "p", source: "smallBusinessBsi", color: "#1769aa" },
    smeLoanRate: { label: "예금은행 중소기업 대출금리", shortLabel: "중소기업 대출금리", frequency: "monthly", unit: "%", deltaUnit: "%p", source: "smeLoanRate", color: "#476b8b" },
    baseRateMonthEnd: { label: "한국은행 기준금리", shortLabel: "한국은행 기준금리", frequency: "monthly", unit: "%", deltaUnit: "%p", source: "baseRate", color: "#1c425f" },
    salesAmount: { label: "부산 소상공인 매출액", shortLabel: "소상공인 매출액", frequency: "quarterly", unit: "원본 단위", source: "busanSmallBusiness", color: "#567f91" },
    startupRate: { label: "부산 소상공인 창업률", shortLabel: "소상공인 창업률", frequency: "quarterly", unit: "%", deltaUnit: "%p", source: "busanSmallBusiness", color: "#3f7d75" },
    closureRate: { label: "부산 소상공인 폐업률", shortLabel: "소상공인 폐업률", frequency: "quarterly", unit: "%", deltaUnit: "%p", source: "busanSmallBusiness", color: "#4f7f86" }
  };
  let category = "district", metric = "newGuarantee", measure = "amount", range = "12", selectedLabel = "", monthIndex = 0, currentPage = "overview", economyCompareKey = "smallBusinessBsi";
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const formatValue = (value, type = "integer") => {
    if (value == null || !Number.isFinite(Number(value))) return "-";
    return Number(value).toLocaleString("ko-KR", type === "rate"
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  const fmt = value => formatValue(value, "integer");
  const fmtRate = value => formatValue(value, "rate");
  const monthly = () => D.monthly[monthIndex];
  const historyMonthly = () => H.monthly[monthIndex];

  async function init() {
    try {
      const [dashboardResponse, historyResponse, externalResponse] = await Promise.all([
        fetch("data/dashboard-data.json", { cache: "no-store" }),
        fetch("data/generated/dashboard-history.json", { cache: "no-store" }),
        fetch("data/external-indicators.json", { cache: "no-store" })
      ]);
      if (!dashboardResponse.ok || !historyResponse.ok || !externalResponse.ok) throw new Error(`HTTP ${dashboardResponse.status}/${historyResponse.status}/${externalResponse.status}`);
      [D, H, X] = await Promise.all([dashboardResponse.json(), historyResponse.json(), externalResponse.json()]);
      validateData();
    } catch (error) {
      console.error("대시보드 데이터 로딩 실패:", error);
      showLoadError();
      return;
    }
    monthIndex = D.monthly.length - 1;
    if ($("#updated-label")) $("#updated-label").textContent = `최근 업데이트 ${D.meta.updatedAt.replaceAll("-", ".")}`;
    D.monthly.forEach((m, i) => $("#month-select").add(new Option(`${m.period.slice(0, 4)}년 ${Number(m.period.slice(5))}월`, i)));
    $("#month-select").value = monthIndex;
    bind(); updatePeriodLabels(); renderAll(); route();
  }

  function validateData() {
    const dashboardGroups = ["monthly", "district", "age", "industry", "tenure"];
    const historyGroups = ["district", "age", "industry", "tenure"];
    if (!D?.meta || dashboardGroups.some(key => !Array.isArray(D[key]) || !D[key].length)) throw new Error("운영 데이터 필수 항목이 없습니다.");
    if (!H?.meta || !Array.isArray(H.monthly) || H.monthly.length !== D.monthly.length || historyGroups.some(key => !Array.isArray(H.dimensions?.[key]))) throw new Error("이력 데이터 필수 항목이 없거나 기간이 일치하지 않습니다.");
    if (D.meta.sourceSha256 !== H.meta.sourceSha256) throw new Error("운영 데이터와 이력 데이터의 원본 기준이 다릅니다.");
    if (!X?.sources || !X?.monthly || !X?.quarterly || !Array.isArray(X.baseRateEvents)) throw new Error("외부지표 데이터 구조가 올바르지 않습니다.");
  }

  function showLoadError() {
    $("#kpi-grid").innerHTML = `<article class="panel" style="grid-column:1/-1"><h3>데이터를 불러오지 못했습니다.</h3><p>정적 웹 서버와 대시보드 이력 파일을 확인해 주세요.</p></article>`;
  }

  function bind() {
    $("#month-select").addEventListener("change", e => { monthIndex = +e.target.value; updatePeriodLabels(); renderAll(); });
    $$(".tabs button").forEach(button => button.addEventListener("click", () => { category = button.dataset.category; selectedLabel = ""; $$(".tabs button").forEach(item => item.setAttribute("aria-selected", item === button)); renderBreakdown(); }));
    $("#metric-switch").addEventListener("click", e => { if (!e.target.dataset.metric) return; metric = e.target.dataset.metric; pageMetricState[currentPage] = metric; if (metric === "accidentRate") measure = "rate"; else if (measure === "rate") measure = "amount"; configureAnalysis(); renderBreakdown(); });
    $("#measure-switch").addEventListener("click", e => { if (!e.target.dataset.measure) return; measure = e.target.dataset.measure; renderBreakdown(); });
    $("#range-switch").addEventListener("click", e => { const button = e.target.closest("button[data-range]"); if (!button) return; range = button.dataset.range; renderSelectionTrend(); });
    $("#economy-compare-select").addEventListener("change", event => { economyCompareKey = event.target.value; renderEconomyComparison(); });
    $(".menu-toggle").addEventListener("click", e => { const open = $("nav").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", open); });
    $$(".nav-item").forEach(item => item.addEventListener("click", () => { $("nav").classList.remove("open"); $(".menu-toggle").setAttribute("aria-expanded", "false"); }));
    window.addEventListener("hashchange", route);
  }

  function route() {
    const requested = location.hash.replace("#", "");
    currentPage = ["overview", "guarantee", "accident", "economy"].includes(requested) ? requested : "overview";
    if (requested !== currentPage) history.replaceState(null, "", `#${currentPage}`);
    const names = { overview: "보증 종합현황", guarantee: "보증현황 분석", accident: "사고율 분석", economy: "지역경제·소상공인 지표" };
    $$(".dashboard-view").forEach(view => { const active = view.dataset.view === currentPage; view.hidden = !active; view.classList.toggle("active", active); });
    $$(".nav-item").forEach(item => { const active = item.dataset.page === currentPage; item.classList.toggle("active", active); active ? item.setAttribute("aria-current", "page") : item.removeAttribute("aria-current"); });
    $("#page-title").textContent = names[currentPage];
    $(".toolbar .crumb").textContent = `홈 / ${names[currentPage]}`;
    $(".controls").classList.toggle("economy-hidden", currentPage === "economy");
    if (currentPage === "guarantee" || currentPage === "accident") {
      $(`#${currentPage}-analysis-host`).appendChild($("#analysis-workspace"));
      metric = pageMetricState[currentPage]; measure = metric === "accidentRate" ? "rate" : "amount"; selectedLabel = "";
      configureAnalysis(); renderBreakdown();
    }
    if (currentPage === "economy") renderEconomy();
    window.scrollTo(0, 0);
  }

  function configureAnalysis() {
    $("#metric-switch").innerHTML = pageMetrics[currentPage].map(key => `<button data-metric="${key}" class="${key === metric ? "active" : ""}">${fields[key].label}</button>`).join("");
    const measures = metric === "accidentRate" ? [{ key: "rate", label: "비율" }] : [{ key: "amount", label: "금액" }, { key: "count", label: "건수" }];
    $("#measure-switch").innerHTML = measures.map(item => `<button data-measure="${item.key}" class="${item.key === measure ? "active" : ""}">${item.label}</button>`).join("");
    $("#analysis-workspace .section-title h2").textContent = currentPage === "accident" ? "분류별 사고 현황" : "분류별 보증 현황";
    $("#analysis-workspace .section-title div p").textContent = currentPage === "accident" ? "사고순증 건수·금액과 연간환산 순증률을 단일 분류 기준으로 분석합니다." : "신규보증 실행과 보증잔액을 금액·건수 기준으로 분석합니다.";
  }

  function updatePeriodLabels() {
    const period = monthly().period, label = `${period.slice(0, 4)}년 ${Number(period.slice(5))}월`;
    $("#period-label").textContent = `${label} 기준`; $("#notice-period").textContent = `${label} 말`; $("#composition-period").textContent = `${label} 기준 · 부산시 전체`;
  }

  function renderAll() {
    renderKpis(); renderRecentOverview(); renderCompositions(); renderTrend(); renderGauge(); renderAccidentSummary(); renderAccidentTrend();
    if (currentPage === "guarantee" || currentPage === "accident") renderBreakdown();
    if (currentPage === "economy") renderEconomy();
  }

  function renderKpis() {
    const now = monthly(), raw = historyMonthly(), prev = D.monthly[Math.max(0, monthIndex - 1)];
    const cards = [{ key: "newGuarantee", value: now.newGuarantee, count: raw.new_guarantee_count }, { key: "balance", value: now.balance, count: raw.guarantee_balance_count }, { key: "accidents", value: now.accidents, count: raw.accident_net_count }, { key: "accidentRate", value: now.accidentRate }];
    const rendered = cards.map(card => {
      const item = fields[card.key], previous = prev[card.key], diff = card.value - previous, pct = previous ? diff / previous * 100 : 0, cls = diff >= 0 ? "up" : "down";
      return `<article class="kpi-card" style="--accent:${item.color}"><div class="kpi-label"><span>${item.label}</span><span class="kpi-period">${now.period}</span></div><div class="kpi-value">${card.key === "accidentRate" ? fmtRate(card.value) : fmt(card.value)}<small>${item.unit === "%" ? "%" : ` ${item.unit}`}</small></div>${card.count == null ? "" : `<div class="kpi-count"><span>건수</span><b>${fmt(card.count)} 건</b></div>`}<div class="delta"><span>전월 대비</span><b class="${cls}">${diff >= 0 ? "▲" : "▼"} ${fmtRate(Math.abs(pct))}%</b></div></article>`;
    });
    $("#kpi-grid").innerHTML = `<div class="kpi-primary-group">${rendered[0]}${rendered[1]}</div><aside class="kpi-risk-group"><div class="risk-group-head"><span>위험 모니터링</span><b>사고 지표</b></div>${rendered[2]}${rendered[3]}</aside>`;
  }

  function periodsToSelected(source, wantedRange = "all") { const bounded = source.filter(row => row.period <= monthly().period); return wantedRange === "12" ? bounded.slice(-12) : bounded; }

  function renderRecentOverview() {
    const data = periodsToSelected(H.monthly, "12");
    const cards = [{ title: "신규보증 실행", key: "new_guarantee_amount", color: "#1769aa" }, { title: "보증잔액", key: "guarantee_balance_amount", color: "#305b88" }, { title: "사고발생 순증", key: "accident_net_amount", color: "#43a8c5" }];
    $("#recent-overview").innerHTML = cards.map((card, i) => `<article class="recent-card"><div><span>${card.title}</span><b>${fmt(data.at(-1)[card.key])}<small> 백만원</small></b></div><div id="recent-chart-${i}" class="mini-chart"></div></article>`).join("");
    cards.forEach((card, i) => renderLine(
      `#recent-chart-${i}`,
      data,
      row => row[card.key],
      card.color,
      false,
      true,
      true,
      card.key === "guarantee_balance_amount",
    ));
  }

  function dimensionRows(name, period = monthly().period) { return H.dimensions[name].filter(row => row.period === period); }

  function renderCompositions() {
    renderCompositionBars("#balance-district-chart", dimensionRows("district"), 5);
    renderCompositionAge("#balance-age-chart", dimensionRows("age"));
    renderCompositionBars("#balance-industry-chart", dimensionRows("industry"), 6);
    renderCompositionBars("#balance-tenure-chart", dimensionRows("tenure"), 7);
  }

  function orderedBalanceRows(source) {
    return [...source].filter(row => Number(row.guarantee_balance_amount) > 0).sort((a, b) => b.guarantee_balance_amount - a.guarantee_balance_amount);
  }

  function renderCompositionBars(selector, source, limit) {
    const rows = orderedBalanceRows(source).slice(0, limit), max = Math.max(...rows.map(row => Number(row.guarantee_balance_amount)), 1);
    $(selector).innerHTML = `<div class="overview-bar-list">${rows.map((row, index) => `<div class="overview-bar-row" title="${escapeHtml(row.label)} · 잔액 ${fmt(row.guarantee_balance_count)} 건 · ${fmt(row.guarantee_balance_amount)} 백만원"><span class="overview-rank">${String(index + 1).padStart(2, "0")}</span><span class="overview-label">${escapeHtml(row.label)}</span><div class="overview-track"><i style="width:${Number(row.guarantee_balance_amount) / max * 100}%"></i></div><b>${fmt(row.guarantee_balance_amount)}</b></div>`).join("")}</div>`;
  }

  function renderCompositionAge(selector, source) {
    const rows = orderedBalanceRows(source), max = Math.max(...rows.map(row => Number(row.guarantee_balance_amount)), 1);
    $(selector).innerHTML = `<div class="overview-age-bars">${rows.map(row => `<div class="overview-age-item" title="${escapeHtml(row.label)} · 잔액 ${fmt(row.guarantee_balance_count)} 건 · ${fmt(row.guarantee_balance_amount)} 백만원"><span>${fmt(row.guarantee_balance_amount)}</span><div><i style="height:${Number(row.guarantee_balance_amount) / max * 100}%"></i></div><b>${escapeHtml(row.label)}</b></div>`).join("")}</div>`;
  }

  function renderTrend() {
    const data = periodsToSelected(D.monthly), W = 980, Ht = 330, p = { l: 64, r: 64, t: 22, b: 38 }, maxNew = Math.max(...data.map(x => x.newGuarantee)) * 1.08, maxAcc = Math.max(...data.map(x => x.accidents)) * 1.08, step = (W - p.l - p.r) / Math.max(data.length - 1, 1), plotH = Ht - p.t - p.b;
    const point = (d, i, key, max) => ({ x: p.l + i * step, y: p.t + plotH * (1 - d[key] / max) }), path = (key, max) => data.map((d, i) => { const q = point(d, i, key, max); return `${i ? "L" : "M"}${q.x.toFixed(2)},${q.y.toFixed(2)}`; }).join(" ");
    const grid = [0, .25, .5, .75, 1].map(t => { const y = p.t + plotH * (1 - t); return `<line class="grid-line" x1="${p.l}" y1="${y}" x2="${W - p.r}" y2="${y}"/><text class="axis-label" x="${p.l - 10}" y="${y + 4}" text-anchor="end">${fmt(maxNew * t)}</text><text class="axis-label axis-right" x="${W - p.r + 10}" y="${y + 4}">${fmt(maxAcc * t)}</text>`; }).join("");
    const labels = data.map((d, i) => (i !== 0 && i !== data.length - 1 && !d.period.endsWith("-01")) ? "" : `<text class="axis-label year-label" x="${point(d, i, "newGuarantee", maxNew).x}" y="${Ht - 11}" text-anchor="middle">${d.period.slice(0, 4)}</text>`).join("");
    $("#trend-chart").innerHTML = `<svg viewBox="0 0 ${W} ${Ht}" preserveAspectRatio="none" aria-hidden="true">${grid}<path class="trend-line-main" d="${path("newGuarantee", maxNew)}"/><path class="trend-line-sub" d="${path("accidents", maxAcc)}"/>${labels}</svg>`;
  }

  function renderGauge() { const rate = monthly().accidentRate, degree = Math.min(rate / 10 * 360, 360); $("#rate-chart").innerHTML = `<div class="gauge"><div class="gauge-ring" style="background:conic-gradient(var(--blue) ${degree}deg,#e9eff2 ${degree}deg)"><div class="gauge-value">${fmtRate(rate)}<small>%</small></div></div><p>연간환산 사고발생 순증률</p></div>`; }

  function renderAccidentSummary() {
    const now = monthly(), raw = historyMonthly();
    $("#accident-summary").innerHTML = [{ label: "사고발생 순증 금액", value: now.accidents, unit: "백만원" }, { label: "사고발생 순증 건수", value: raw.accident_net_count, unit: "건" }, { label: "연간환산 사고발생 순증률", value: now.accidentRate, unit: "%", rate: true }].map(item => `<article class="kpi-card"><div class="kpi-label"><span>${item.label}</span><span class="kpi-period">${now.period}</span></div><div class="kpi-value">${item.rate ? fmtRate(item.value) : fmt(item.value)}<small>${item.unit === "%" ? "%" : ` ${item.unit}`}</small></div></article>`).join("");
  }

  function renderAccidentTrend() {
    const data = periodsToSelected(D.monthly), W = 980, Ht = 330, p = { l: 66, r: 66, t: 28, b: 40 }, plotW = W - p.l - p.r, plotH = Ht - p.t - p.b, step = plotW / Math.max(data.length, 1), amounts = data.map(x => x.accidents), minAmount = Math.min(0, ...amounts), maxAmount = Math.max(...amounts, 1), amountSpan = maxAmount - minAmount || 1, maxRate = Math.max(...data.map(x => x.accidentRate), 1) * 1.08;
    const yAmount = value => p.t + plotH * (1 - (value - minAmount) / amountSpan), yRate = value => p.t + plotH * (1 - value / maxRate), zeroY = yAmount(0), barWidth = Math.max(3, Math.min(10, step * .58));
    const bars = data.map((d, i) => { const x = p.l + i * step + step / 2 - barWidth / 2, y = yAmount(d.accidents), height = Math.max(1, Math.abs(zeroY - y)); return `<rect class="accident-bar" x="${x.toFixed(2)}" y="${Math.min(y, zeroY).toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height.toFixed(2)}"/>`; }).join("");
    const ratePath = data.map((d, i) => `${i ? "L" : "M"}${(p.l + i * step + step / 2).toFixed(2)},${yRate(d.accidentRate).toFixed(2)}`).join(" ");
    const grid = [0, .25, .5, .75, 1].map(t => { const y = p.t + plotH * (1 - t); return `<line class="grid-line" x1="${p.l}" y1="${y}" x2="${W - p.r}" y2="${y}"/><text class="axis-label" x="${p.l - 10}" y="${y + 4}" text-anchor="end">${fmt(minAmount + amountSpan * t)}</text><text class="axis-label" x="${W - p.r + 10}" y="${y + 4}">${fmtRate(maxRate * t)}</text>`; }).join("");
    const labels = data.map((d, i) => (i === 0 || i === data.length - 1 || d.period.endsWith("-01")) ? `<text class="axis-label" x="${p.l + i * step + step / 2}" y="${Ht - 10}" text-anchor="middle">${d.period.slice(0, 4)}</text>` : "").join("");
    $("#accident-trend-chart").innerHTML = `<svg viewBox="0 0 ${W} ${Ht}" preserveAspectRatio="none" aria-hidden="true">${grid}<text class="axis-unit" x="${p.l}" y="14">백만원</text><text class="axis-unit axis-unit-right" x="${W - p.r}" y="14" text-anchor="end">%</text>${bars}<path class="trend-line-rate" d="${ratePath}"/>${labels}</svg>`;
  }

  function annualizedRate(period, label, dimension) {
    const rows = H.dimensions[dimension].filter(row => row.label === label && row.period <= period && row.period.slice(0, 4) === period.slice(0, 4)), current = rows.find(row => row.period === period);
    if (!current || !current.guarantee_balance_amount) return null;
    const ytd = rows.reduce((sum, row) => sum + Number(row.accident_net_amount), 0), [year, month] = period.split("-").map(Number), elapsed = Math.round((Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / 86400000);
    return ytd / current.guarantee_balance_amount * (365 / elapsed) * 100;
  }

  function rowValue(row) { if (metric === "accidentRate") return annualizedRate(row.period, row.label, category); return Number(row[fields[metric][measure]]); }
  function unitLabel() { return metric === "accidentRate" ? "%" : measure === "count" ? "건" : "백만원"; }
  function unitSuffix() { return unitLabel() === "%" ? "%" : ` ${unitLabel()}`; }
  function unitText() { return `단위 : ${unitLabel()}`; }

  function mixHex(start, end, ratio) {
    const value = Math.max(0, Math.min(1, ratio));
    const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
    const a = rgb(start), b = rgb(end);
    return `#${a.map((channel, index) => Math.round(channel + (b[index] - channel) * value).toString(16).padStart(2, "0")).join("")}`;
  }

  function mapTooltipLines(row) {
    if (metric === "accidentRate") return [`${fields[metric].label} ${fmtRate(row.value)}%`];
    const item = fields[metric], primary = `${item.label} ${measure === "count" ? "건수" : "금액"} ${fmt(row.value)}${unitSuffix()}`;
    const companionKey = measure === "count" ? item.amount : item.count;
    const companionUnit = measure === "count" ? " 백만원" : " 건";
    return [primary, `${item.label} ${measure === "count" ? "금액" : "건수"} ${fmt(row[companionKey])}${companionUnit}`];
  }

  function renderDistrictMap(rows) {
    const byName = new Map(rows.map(row => [row.label, row]));
    const values = rows.map(row => Number(row.value)).filter(Number.isFinite), min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    const colors = currentPage === "accident" ? ["#fbeeed", "#a94e49"] : ["#edf6fb", "#173f67"];
    const paths = districtShapes.map(shape => {
      const row = byName.get(shape.name), value = Number(row?.value) || 0, fill = mixHex(colors[0], colors[1], (value - min) / span), selected = shape.name === selectedLabel;
      const label = shape.label ? `<text class="district-map-label${shape.small ? " district-map-label-small" : ""}" x="${shape.label[0]}" y="${shape.label[1]}">${shape.name}</text>` : "";
      return `<g class="district-shape ${selected ? "selected" : ""}" data-district="${shape.name}" tabindex="0" role="button" aria-label="${shape.name} ${metric === "accidentRate" ? fmtRate(value) : fmt(value)}${unitSuffix()}"><path d="${shape.path}" style="fill:${fill}"/>${label}</g>`;
    }).join("");
    $("#district-map").innerHTML = `<svg viewBox="0 0 1052 818" role="img" aria-label="부산 16개 구군 통계 지도">${paths}</svg><div class="map-tooltip" aria-hidden="true"></div>`;
    const mid = min + span / 2;
    const formatLegendValue = metric === "accidentRate" ? fmtRate : fmt;
    $("#map-legend").innerHTML = `<div class="map-scale" aria-hidden="true">${[0, .2, .4, .6, .8, 1].map(t => `<i style="background:${mixHex(colors[0], colors[1], t)}"></i>`).join("")}</div><div class="map-scale-values"><span>${formatLegendValue(min)}${unitSuffix()}</span><span>${formatLegendValue(mid)}${unitSuffix()}</span><span>${formatLegendValue(max)}${unitSuffix()}</span></div>`;
    const host = $("#district-map"), tooltip = host.querySelector(".map-tooltip");
    host.querySelectorAll("[data-district]").forEach(item => {
      const show = event => {
        const row = byName.get(item.dataset.district), lines = mapTooltipLines(row);
        tooltip.innerHTML = `<b>${item.dataset.district}</b>${lines.map(line => `<span>${line}</span>`).join("")}`;
        const box = host.getBoundingClientRect(), point = event.touches?.[0] || event;
        tooltip.style.left = `${Math.min(Math.max((point.clientX || box.left + box.width / 2) - box.left + 12, 8), box.width - 190)}px`;
        tooltip.style.top = `${Math.min(Math.max((point.clientY || box.top + box.height / 2) - box.top - 58, 8), box.height - 76)}px`;
        tooltip.classList.add("show");
      };
      item.addEventListener("pointerenter", show); item.addEventListener("pointermove", show); item.addEventListener("pointerleave", () => tooltip.classList.remove("show"));
      item.addEventListener("focus", show); item.addEventListener("blur", () => tooltip.classList.remove("show"));
      const select = () => { selectedLabel = item.dataset.district; renderBreakdown(); };
      item.addEventListener("click", select); item.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
    });
  }

  function renderBreakdown() {
    if (!H || currentPage === "overview") return;
    $$("#metric-switch button").forEach(button => button.classList.toggle("active", button.dataset.metric === metric)); $$("#measure-switch button").forEach(button => button.classList.toggle("active", button.dataset.measure === measure));
    const unknown = label => /값없음|미분류/.test(label), allRows = dimensionRows(category).map(row => ({ ...row, value: rowValue(row) })).sort((a, b) => Number(unknown(a.label)) - Number(unknown(b.label)) || (b.value ?? -Infinity) - (a.value ?? -Infinity)), rows = allRows;
    if (!selectedLabel || !rows.some(row => row.label === selectedLabel)) selectedLabel = rows[0]?.label || "";
    const max = Math.max(...rows.map(row => Number(row.value) || 0), 1), total = currentTotal();
    $("#analysis-current").innerHTML = `<div><span>기준월</span><b>${monthly().period}</b></div><div><span>${fields[metric].label} · ${measure === "count" ? "건수" : measure === "rate" ? "비율" : "금액"}</span><b>${metric === "accidentRate" ? fmtRate(total) : fmt(total)}${unitSuffix()}</b></div><div><span>분석 기준</span><b>${dimensions[category]}별 ${rows.length}개 항목</b></div>`;
    $("#distribution-title").textContent = `${dimensions[category]}별 현황 및 분포`;
    $("#distribution-description").textContent = `${fields[metric].label} · ${measure === "count" ? "건수" : measure === "rate" ? "연간환산 비율" : "금액"} 기준 전체 항목`;
    $("#distribution-unit").textContent = unitText();
    $("#selection-unit").textContent = unitText();
    $("#table-unit").textContent = currentPage === "accident" ? "단위 : 백만원, 건, %" : "단위 : 백만원, 건";
    $("#table-summary").textContent = `${monthly().period} · ${dimensions[category]}별 · ${fields[metric].label} · ${unitLabel()}`;
    const mapMode = category === "district";
    $("#distribution-content").classList.toggle("map-mode", mapMode);
    $("#district-map-panel").hidden = !mapMode;
    const distribution = category === "age";
    $("#ranking-chart").className = `ranking-chart ${distribution ? "distribution-chart" : "ranking-mode"}`;
    $("#ranking-chart").innerHTML = distribution ? rows.map(row => `<button class="distribution-item ${row.label === selectedLabel ? "selected" : ""}" data-label="${escapeHtml(row.label)}" title="${currentPage === "accident" ? `잔액 ${fmt(row.guarantee_balance_count)} 건 · ${fmt(row.guarantee_balance_amount)} 백만원` : ""}"><span class="distribution-value">${metric === "accidentRate" ? fmtRate(row.value) : fmt(row.value)}${unitSuffix()}</span><div class="distribution-track"><i style="height:${(Number(row.value) || 0) / max * 100}%"></i></div><span class="distribution-label">${escapeHtml(row.label)}</span></button>`).join("") : rows.map((row, i) => `<button class="rank-row ${row.label === selectedLabel ? "selected" : ""} ${unknown(row.label) ? "unknown-row" : ""}" data-label="${escapeHtml(row.label)}" title="${currentPage === "accident" ? `잔액 ${fmt(row.guarantee_balance_count)} 건 · ${fmt(row.guarantee_balance_amount)} 백만원` : ""}"><span class="rank-index">${String(i + 1).padStart(2, "0")}</span><span class="rank-name">${escapeHtml(row.label)}${currentPage === "accident" ? `<small>잔액 ${fmt(row.guarantee_balance_count)} 건 · ${fmt(row.guarantee_balance_amount)} 백만원</small>` : ""}</span><div class="bar-track"><div class="bar-fill" style="width:${(Number(row.value) || 0) / max * 100}%"></div></div><span class="rank-value">${metric === "accidentRate" ? fmtRate(row.value) : fmt(row.value)}${unitSuffix()}</span></button>`).join("");
    if (mapMode) renderDistrictMap(allRows);
    const amountHeading = metric === "accidentRate" ? "사고발생 순증 금액" : `${fields[metric].label} 금액`;
    $("#data-table-head").innerHTML = `<tr><th>구분</th><th>${amountHeading}</th>${metric === "accidentRate" ? "" : `<th>${fields[metric].label} 건수</th>`}${currentPage === "accident" ? "<th>연간환산 순증률</th>" : ""}</tr>`;
    $("#data-table").innerHTML = rows.map(row => `<tr class="${row.label === selectedLabel ? "selected" : ""}" data-label="${escapeHtml(row.label)}"><td>${row.label}</td><td>${fmt(row[metric === "accidentRate" ? "accident_net_amount" : fields[metric].amount])}</td>${metric === "accidentRate" ? "" : `<td>${fmt(row[fields[metric].count])}</td>`}${currentPage === "accident" ? `<td>${fmtRate(annualizedRate(row.period, row.label, category))}%</td>` : ""}</tr>`).join("");
    $$("#ranking-chart [data-label], #data-table [data-label]").forEach(item => item.addEventListener("click", () => { selectedLabel = item.dataset.label; renderBreakdown(); }));
    renderSelectionTrend();
  }

  function currentTotal() { if (metric === "accidentRate") return monthly().accidentRate; return Number(historyMonthly()[fields[metric][measure]]); }

  function offsetMonth(period, offset) {
    const [year, month] = period.split("-").map(Number), date = new Date(Date.UTC(year, month - 1 + offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  function selectedHistoryRows() {
    const endPeriod = monthly().period, startPeriod = offsetMonth(endPeriod, -11);
    return H.dimensions[category]
      .filter(row => row.label === selectedLabel && row.period <= endPeriod && (range !== "12" || row.period >= startPeriod))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  function renderSelectionTrend() {
    if (!selectedLabel || currentPage === "overview") return;
    $$("#range-switch button").forEach(button => button.classList.toggle("active", button.dataset.range === range));
    const rows = selectedHistoryRows();
    const values = rows.map(row => ({ ...row, value: rowValue(row) }));
    $("#selection-title").textContent = `${selectedLabel} 월별 추이`; $("#selection-description").textContent = `${fields[metric].label} · ${measure === "count" ? "건수" : measure === "rate" ? "연간환산 비율" : "금액"} · ${range === "12" ? "최근 12개월" : "전체 기간"}`;
    renderLine("#selection-chart", values, row => row.value, fields[metric].color, metric === "accidentRate", false, range !== "all");
  }

  function renderLine(selector, data, getter, color, decimal = false, compact = false, showMarkers = true, focusScale = false) {
    if (!data.length) { $(selector).textContent = "표시할 데이터가 없습니다."; return; }
    const W = compact ? 360 : 960, Ht = compact ? 92 : 250, p = compact ? { l: 4, r: 4, t: 10, b: 16 } : { l: 58, r: 18, t: 18, b: 34 }, values = data.map(getter), rawMin = Math.min(...values), rawMax = Math.max(...values), focusedPadding = focusScale ? Math.max((rawMax - rawMin) * .12, Math.abs(rawMax) * .001) : 0, min = focusScale ? rawMin - focusedPadding : Math.min(rawMin, 0), max = focusScale ? rawMax + focusedPadding : Math.max(rawMax, 1), span = max - min || 1, step = (W - p.l - p.r) / Math.max(data.length - 1, 1), y = value => p.t + (Ht - p.t - p.b) * (1 - (value - min) / span);
    const path = values.map((value, i) => `${i ? "L" : "M"}${(p.l + i * step).toFixed(2)},${y(value).toFixed(2)}`).join(" "), labels = compact ? "" : data.map((row, i) => (i === 0 || i === data.length - 1 || data.length <= 12) ? `<text class="axis-label" x="${p.l + i * step}" y="${Ht - 8}" text-anchor="middle">${row.period.slice(2).replace("-", ".")}</text>` : "").join(""), points = compact ? "" : data.map((row, i) => `<g class="selection-point ${showMarkers ? "" : "marker-hidden"}" data-index="${i}" style="color:${color}"><circle cx="${p.l + i * step}" cy="${y(values[i])}" r="3"/></g>`).join("");
    $(selector).innerHTML = `<svg viewBox="0 0 ${W} ${Ht}" preserveAspectRatio="none" aria-hidden="true"><path class="spark-area" d="${path} L${W - p.r},${Ht - p.b} L${p.l},${Ht - p.b} Z" style="fill:${color}12"/><path class="selection-line" d="${path}" style="stroke:${color}"/>${points}${labels}</svg>${compact ? "" : `<div class="line-tooltip" aria-hidden="true"></div>`}`;
    if (!compact) {
      const chart = $(selector), tooltip = chart.querySelector(".line-tooltip");
      chart.querySelectorAll(".selection-point").forEach(point => {
        point.addEventListener("pointerenter", () => { const i = +point.dataset.index; tooltip.innerHTML = `<b>${data[i].period}</b><span>${decimal ? fmtRate(values[i]) : fmt(values[i])}${unitSuffix()}</span>`; tooltip.classList.add("show"); });
        point.addEventListener("pointermove", event => { const box = chart.getBoundingClientRect(); tooltip.style.left = `${Math.min(event.clientX - box.left + 12, box.width - 132)}px`; tooltip.style.top = `${Math.max(event.clientY - box.top - 56, 6)}px`; });
        point.addEventListener("pointerleave", () => tooltip.classList.remove("show"));
      });
    }
  }

  function externalValue(value, unit) {
    if (value == null || !Number.isFinite(Number(value))) return "-";
    if (unit === "%") return `${fmtRate(value)}%`;
    if (unit === "지수") return fmtRate(value);
    if (unit === "개") return `${fmt(value)} 개`;
    return `${fmt(value)}${unit && unit !== "원본 단위" ? ` ${unit}` : ""}`;
  }

  function externalPeriodLabel(period, frequency) {
    if (!period) return "기준시점 미수집";
    if (frequency === "quarterly") return `${period.slice(0, 4)}년 ${Number(period.slice(-1))}분기`;
    return `${period.slice(0, 4)}년 ${Number(period.slice(5))}월`;
  }

  function comparisonDelta(rows, index, lag, key = "value", pointUnit = "") {
    if (index < lag || rows[index]?.[key] == null || rows[index - lag]?.[key] == null) return "비교자료 없음";
    const diff = Number(rows[index][key]) - Number(rows[index - lag][key]);
    if (pointUnit) return `${diff > 0 ? "+" : ""}${fmtRate(diff)}${pointUnit}`;
    const previous = Number(rows[index - lag][key]);
    if (!previous) return "비교자료 없음";
    const rate = diff / previous * 100;
    return `${diff > 0 ? "+" : ""}${fmtRate(rate)}%`;
  }

  function emptyTrend() {
    return `<div class="external-empty-trend"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>`;
  }

  function economySparkline(data, key, color, frequency, style = "line") {
    if (!data.length) return emptyTrend();
    const rows = data.slice(frequency === "monthly" ? -12 : -8), values = rows.map(row => Number(row[key])).filter(Number.isFinite);
    if (!values.length) return emptyTrend();
    const W = 260, Ht = 54, min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    const coords = values.map((value, index) => ({ x: index / Math.max(values.length - 1, 1) * W, y: Ht - 5 - (value - min) / span * (Ht - 10) }));
    const path = coords.map((point, index) => {
      if (!index) return `M${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      const previous = coords[index - 1];
      return style === "step" ? `L${point.x.toFixed(2)},${previous.y.toFixed(2)} L${point.x.toFixed(2)},${point.y.toFixed(2)}` : `L${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(" ");
    return `<svg viewBox="0 0 ${W} ${Ht}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" style="fill:none;stroke:${color};stroke-width:2;vector-effect:non-scaling-stroke"/></svg>`;
  }

  function monthlyEconomyCard(key) {
    const config = externalSeries[key], rows = X.monthly[key] || [], current = rows.at(-1), source = X.sources[config.source];
    if (!current) return `<article class="economy-metric economy-${key} economy-metric-empty"><div class="economy-metric-head"><span>${config.label}</span><b>월별</b></div><strong>데이터 수집 대기</strong><p>KOSIS·ECOS 인증정보 설정 후 자동수집됩니다.</p><div class="economy-sparkline">${emptyTrend()}</div><div class="economy-source-note">${source.provider}${source.scope ? ` · ${source.scope}` : source.region ? ` · ${source.region}` : ""}</div></article>`;
    const index = rows.length - 1, pointUnit = config.deltaUnit || "";
    return `<article class="economy-metric economy-${key}"><div class="economy-metric-head"><span>${config.label}</span><b>${config.unit}</b></div><strong>${externalValue(current.value, config.unit)}</strong><p>${externalPeriodLabel(current.period, "monthly")} 기준</p><dl><div><dt>전월 대비</dt><dd>${comparisonDelta(rows, index, 1, "value", pointUnit)}</dd></div><div><dt>전년동월 대비</dt><dd>${comparisonDelta(rows, index, 12, "value", pointUnit)}</dd></div></dl><div class="economy-sparkline">${economySparkline(rows, "value", config.color, "monthly")}</div><div class="economy-source-note">${source.provider}${source.scope ? ` · ${source.scope}` : source.region ? ` · ${source.region}` : ""}</div></article>`;
  }

  function baseRateCard() {
    const events = X.baseRateEvents || [], current = events.at(-1), source = X.sources.baseRate;
    if (!current) return `<article class="economy-metric economy-policy economy-metric-empty"><div class="economy-metric-head"><span>한국은행 기준금리</span><b>정책금리</b></div><strong>데이터 수집 대기</strong><p>ECOS 인증정보 설정 후 변경 이력을 수집합니다.</p><div class="economy-sparkline">${emptyTrend()}</div><div class="economy-source-note">${source.provider} · 전국</div></article>`;
    const previous = events.at(-2), diff = previous ? Number(current.value) - Number(previous.value) : current.changePercentagePoint;
    return `<article class="economy-metric economy-policy"><div class="economy-metric-head"><span>한국은행 기준금리</span><b>정책금리</b></div><strong>${externalValue(current.value, "%")}</strong><p>최근 변경일 ${current.effectiveDate}</p><dl><div><dt>직전 변경 대비</dt><dd>${diff == null ? "비교자료 없음" : `${diff > 0 ? "+" : ""}${fmtRate(diff)}%p`}</dd></div><div><dt>최근 변경</dt><dd>${current.effectiveDate}</dd></div></dl><div class="economy-sparkline">${economySparkline(X.monthly.baseRateMonthEnd || [], "value", externalSeries.baseRateMonthEnd.color, "monthly", "step")}</div><div class="economy-source-note">${source.provider} · 전국</div></article>`;
  }

  function quarterlyEconomyCard(key, label, unit) {
    const rows = X.quarterly.busanSmallBusiness || [], current = rows.at(-1), source = X.sources.busanSmallBusiness;
    if (!current || current[key] == null) return `<article class="quarter-metric quarter-${key} quarter-metric-empty"><header><span>${label}</span><b>분기</b></header><strong>데이터 수집 대기</strong><p>공식 Excel 통계표를 등록하면 갱신됩니다.</p><div class="economy-sparkline">${emptyTrend()}</div><div class="economy-source-note">${source.provider}</div></article>`;
    const index = rows.length - 1, isRate = unit === "%", pointUnit = isRate ? "%p" : "";
    return `<article class="quarter-metric quarter-${key}"><header><span>${label}</span><b>${current.status === "provisional" ? "잠정 · 분기" : "분기"}</b></header><strong>${externalValue(current[key], unit)}</strong><p>${externalPeriodLabel(current.period, "quarterly")} 기준</p><dl><div><dt>전분기 대비</dt><dd>${comparisonDelta(rows, index, 1, key, pointUnit)}</dd></div><div><dt>전년동분기 대비</dt><dd>${comparisonDelta(rows, index, 4, key, pointUnit)}</dd></div></dl><div class="economy-sparkline">${economySparkline(rows, key, isRate ? (key === "closureRate" ? "#a45a55" : "#3f7d75") : "#426f91", "quarterly")}</div><div class="economy-source-note">${source.provider}</div></article>`;
  }

  function renderEconomy() {
    if (!X) return;
    $("#economy-monthly-grid").innerHTML = monthlyEconomyCard("smallBusinessBsi") + monthlyEconomyCard("smeLoanRate") + baseRateCard();
    const quarterRows = X.quarterly.busanSmallBusiness || [], latestQuarter = quarterRows.at(-1);
    $("#economy-quarterly-period").textContent = latestQuarter ? `${externalPeriodLabel(latestQuarter.period, "quarterly")} · ${latestQuarter.status === "provisional" ? "잠정" : "확정"}` : "분기 통계 · 데이터 수집 대기";
    const salesUnit = latestQuarter?.units?.salesAmount || "원본 단위";
    $("#economy-quarterly-grid").innerHTML = quarterlyEconomyCard("businessCount", "소상공인 사업체수", "개") + quarterlyEconomyCard("salesAmount", "소상공인 매출액", salesUnit) + quarterlyEconomyCard("startupRate", "소상공인 창업률", "%") + quarterlyEconomyCard("closureRate", "소상공인 폐업률", "%");
    const options = ["smallBusinessBsi", "smeLoanRate", "baseRateMonthEnd", "salesAmount", "startupRate", "closureRate"];
    $("#economy-compare-select").innerHTML = options.map(key => `<option value="${key}" ${key === economyCompareKey ? "selected" : ""}>${externalSeries[key].shortLabel}</option>`).join("");
    renderEconomyComparison();
    $("#economy-source-list").innerHTML = Object.values(X.sources).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer"><span>${escapeHtml(source.dataset)}</span><b>${escapeHtml(source.provider)}${source.scope ? ` · ${escapeHtml(source.scope)}` : source.region ? ` · ${escapeHtml(source.region)}` : ""}</b><small>${source.retrievedAt ? `수집 ${escapeHtml(source.retrievedAt)}` : "수집 대기"}</small></a>`).join("");
  }

  function comparisonRows(key) {
    const config = externalSeries[key];
    if (config.frequency === "monthly") {
      const external = new Map((X.monthly[key] || []).map(row => [row.period, row]));
      return D.monthly.filter(row => external.has(row.period)).map(row => ({ period: row.period, accidentRate: Number(row.accidentRate), external: Number(external.get(row.period).value) }));
    }
    return (X.quarterly.busanSmallBusiness || []).filter(row => row[key] != null).map(row => {
      const period = row.periodEnd?.slice(0, 7) || `${row.period.slice(0, 4)}-${String(Number(row.period.slice(-1)) * 3).padStart(2, "0")}`;
      const accident = D.monthly.find(item => item.period === period);
      return accident ? { period: row.period, accidentRate: Number(accident.accidentRate), external: Number(row[key]) } : null;
    }).filter(Boolean);
  }

  function renderEconomyComparison() {
    const config = externalSeries[economyCompareKey], rows = comparisonRows(economyCompareKey), host = $("#economy-comparison-chart");
    const accidentLatest = D.monthly.at(-1), externalLatest = config.frequency === "monthly" ? (X.monthly[economyCompareKey] || []).at(-1) : (X.quarterly.busanSmallBusiness || []).at(-1);
    const displayUnit = config.frequency === "quarterly" ? (externalLatest?.units?.[economyCompareKey] || config.unit) : config.unit;
    $("#economy-right-axis-unit").textContent = `우축 : ${config.shortLabel} (${displayUnit})`;
    const externalRawValue = config.frequency === "monthly" ? externalLatest?.value : externalLatest?.[economyCompareKey];
    $("#economy-monitor-summary").innerHTML = `<div><span>재단 사고발생 순증률</span><b>${fmtRate(accidentLatest.accidentRate)}%</b><small>${accidentLatest.period}</small></div><div><span>${config.shortLabel}</span><b>${externalRawValue == null ? "수집 대기" : externalValue(externalRawValue, displayUnit)}</b><small>${externalLatest?.period || "기준시점 미수집"}</small></div>`;
    if (!rows.length) { host.innerHTML = `<div class="economy-chart-empty"><div class="chart-skeleton" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><b>비교할 외부지표가 아직 수집되지 않았습니다.</b><span>외부지표 JSON이 갱신되면 기존 사고율 이력과 동일 기간 기준으로 자동 연결됩니다.</span></div>`; return; }
    const W = 1080, Ht = 350, p = { l: 66, r: 74, t: 28, b: 44 }, plotW = W - p.l - p.r, plotH = Ht - p.t - p.b, accidentMax = Math.max(...rows.map(row => row.accidentRate), 1) * 1.08, extValues = rows.map(row => row.external), extMin = Math.min(...extValues), extMax = Math.max(...extValues), extSpan = extMax - extMin || 1, step = plotW / Math.max(rows.length - 1, 1);
    const x = index => p.l + step * index, yAccident = value => p.t + plotH * (1 - value / accidentMax), yExternal = value => p.t + plotH * (1 - (value - extMin) / extSpan);
    const accidentPath = rows.map((row, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${yAccident(row.accidentRate).toFixed(2)}`).join(" "), externalPath = rows.map((row, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${yExternal(row.external).toFixed(2)}`).join(" ");
    const grid = [0, .25, .5, .75, 1].map(t => { const y = p.t + plotH * (1 - t); return `<line class="grid-line" x1="${p.l}" y1="${y}" x2="${W - p.r}" y2="${y}"/><text class="axis-label" x="${p.l - 10}" y="${y + 4}" text-anchor="end">${fmtRate(accidentMax * t)}</text><text class="axis-label" x="${W - p.r + 10}" y="${y + 4}">${displayUnit === "%" || displayUnit === "지수" ? fmtRate(extMin + extSpan * t) : fmt(extMin + extSpan * t)}</text>`; }).join("");
    const labels = rows.map((row, i) => (rows.length <= 12 || i === 0 || i === rows.length - 1 || i % Math.ceil(rows.length / 8) === 0) ? `<text class="axis-label" x="${x(i)}" y="${Ht - 12}" text-anchor="middle">${row.period.replace("-", ".")}</text>` : "").join("");
    const accidentColor = "#a5524c", points = rows.map((row, i) => `<g><circle class="economy-accident-point" cx="${x(i)}" cy="${yAccident(row.accidentRate)}" r="3" fill="${accidentColor}"><title>${row.period} · 사고발생 순증률 ${fmtRate(row.accidentRate)}%</title></circle><circle class="economy-external-point" cx="${x(i)}" cy="${yExternal(row.external)}" r="3" fill="${config.color}"><title>${row.period} · ${config.shortLabel} ${externalValue(row.external, displayUnit)}</title></circle></g>`).join("");
    host.innerHTML = `<div class="economy-chart-legend"><span><i class="accident" style="background:${accidentColor}"></i>사고발생 순증률</span><span><i style="background:${config.color}"></i>${config.shortLabel}</span></div><svg viewBox="0 0 ${W} ${Ht}" preserveAspectRatio="none" aria-hidden="true">${grid}<path class="economy-accident-line" d="${accidentPath}" style="stroke:${accidentColor}"/><path class="economy-external-line" d="${externalPath}" style="stroke:${config.color}"/>${points}${labels}</svg>`;
  }

  function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

  init();
})();
