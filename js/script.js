const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

navToggle.addEventListener("click", () => {
  const open = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

siteNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    siteNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

// 전체 화면 스크롤 스냅 (천천히, 속도 조절 가능) - PC에서만, 홈 화면(히어로+미리보기 섹션)에만 적용
(function () {
  const sections = Array.from(document.querySelectorAll(".hero, .preview-section"));
  if (sections.length < 2) return;
  if (window.matchMedia("(max-width: 640px)").matches) return;

  const DURATION = 1100; // ms - 숫자를 키우면 더 천천히, 줄이면 더 빠르게 이동
  let isAnimating = false;
  let touchStartY = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function currentIndex() {
    const y = window.scrollY;
    let closest = 0;
    let minDist = Infinity;
    sections.forEach((sec, i) => {
      const dist = Math.abs(sec.offsetTop - y);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    return closest;
  }

  function scrollToIndex(i) {
    i = Math.max(0, Math.min(sections.length - 1, i));
    const target = sections[i].offsetTop;
    const start = window.scrollY;
    const distance = target - start;
    if (distance === 0) return;
    isAnimating = true;
    const startTime = performance.now();
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      window.scrollTo(0, start + distance * easeInOutCubic(progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isAnimating = false;
      }
    }
    requestAnimationFrame(step);
  }

  window.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (isAnimating) return;
    const idx = currentIndex();
    if (e.deltaY > 0) scrollToIndex(idx + 1);
    else if (e.deltaY < 0) scrollToIndex(idx - 1);
  }, { passive: false });

  window.addEventListener("keydown", (e) => {
    if (isAnimating) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      scrollToIndex(currentIndex() + 1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      scrollToIndex(currentIndex() - 1);
    }
  });

  window.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchend", (e) => {
    if (touchStartY === null || isAnimating) return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      const idx = currentIndex();
      if (diff > 0) scrollToIndex(idx + 1);
      else scrollToIndex(idx - 1);
    }
    touchStartY = null;
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const targetEl = document.querySelector(link.getAttribute("href"));
    const idx = sections.indexOf(targetEl);
    if (idx === -1) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToIndex(idx);
    });
  });
})();

// 아스콘의 재료: 완성품(중앙)-재료(동서남북) 다이어그램, 마우스오버/클릭 시 우측 설명 전환 + 노드 강조·비활성 노드 흑백 처리
(function () {
  const visual = document.getElementById("materialVisual");
  if (!visual) return;

  const MATERIALS = {
    asphalt: {
      name: "아스팔트",
      desc: "아스팔트 바인더, 굵은 골재, 잔골재, 채움재가 알맞은 비율로 배합되어 완성되는 아스팔트 콘크리트(아스콘)입니다.",
    },
    binder: {
      name: "아스팔트 바인더",
      desc: "석유를 정제하는 과정에서 얻어지는 점성이 높은 흑갈색 물질로, 아스팔트 혼합물에서 골재를 서로 붙여주는 접착재 역할을 합니다.",
      points: [
        "골재(자갈·모래 등)와 혼합되어 아스팔트 콘크리트(아스콘)를 구성",
        "도로의 강도·내구성·방수성을 확보하는 역할",
        "균열 및 변형에 대한 저항성을 부여하며 차량 하중을 골재에 전달",
      ],
    },
    coarse: {
      name: "굵은 골재",
      desc: "아스팔트나 콘크리트에 사용되는 입자가 비교적 큰 골재(粗骨材, Coarse Aggregate)입니다.",
      points: [
        "차량 하중을 지지하고 아스콘의 구조적 강도 확보",
        "변형 및 밀림에 대한 저항성 확보",
        "전체 혼합물의 골격 형성",
      ],
    },
    fine: {
      name: "잔골재",
      desc: "굵은골재보다 입자가 작은 모래 또는 쇄석 미립분 등의 골재(細骨材, Fine Aggregate)입니다.",
      points: [
        "굵은골재 사이의 빈 공간을 충전, 표면 마감 및 작업성 개선",
        "골재 간 맞물림을 향상시켜 혼합물의 치밀성 확보",
      ],
    },
    filler: {
      name: "채움재",
      desc: "골재 사이의 아주 작은 빈 공간을 채워주는 미세한 분말 재료로, 일반적으로 석회석 등을 분쇄하여 사용합니다.",
      points: [
        "골재 사이의 미세한 공극 충전",
        "아스팔트 바인더와 결합하여 매스틱(mastic) 형성",
        "아스콘의 강도 및 안정성 향상",
      ],
    },
  };

  const nameEl = document.getElementById("materialName");
  const descEl = document.getElementById("materialDesc");
  const extraEl = document.getElementById("materialExtra");
  const nodes = Array.from(visual.querySelectorAll(".material-node"));

  function render(key) {
    const m = MATERIALS[key];
    nameEl.textContent = m.name;
    descEl.textContent = m.desc;
    extraEl.innerHTML = "";
    if (m.points) {
      const ul = document.createElement("ul");
      ul.className = "material-points";
      m.points.forEach((pt) => {
        const li = document.createElement("li");
        li.textContent = pt;
        ul.appendChild(li);
      });
      extraEl.appendChild(ul);
    }
  }

  function setActive(key) {
    nodes.forEach((n) => {
      const isActive = n.dataset.material === key;
      n.classList.toggle("is-active", isActive);
      n.classList.toggle("is-dimmed", !isActive);
    });
    render(key);
  }

  function clearHighlight() {
    nodes.forEach((n) => {
      n.classList.remove("is-active", "is-dimmed");
    });
    render("asphalt");
  }

  nodes.forEach((node) => {
    node.addEventListener("mouseenter", () => setActive(node.dataset.material));
    node.addEventListener("focus", () => setActive(node.dataset.material));
    node.addEventListener("click", () => setActive(node.dataset.material));
  });
  visual.addEventListener("mouseleave", clearHighlight);

  render("asphalt");
})();

// 사업영역 이동탭: 클릭한 탭의 화면만 보여주는 개별 탭 전환
(function () {
  const tabs = Array.from(document.querySelectorAll(".biz-tabs button"));
  if (tabs.length === 0) return;

  const panels = tabs.map((tab) => document.getElementById("tab-" + tab.dataset.tab)).filter(Boolean);

  function activate(name) {
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === name));
    panels.forEach((panel) => {
      panel.hidden = panel.id !== "tab-" + name;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activate(tab.dataset.tab);
      const tabsBar = document.querySelector(".biz-tabs");
      if (tabsBar) tabsBar.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  });
})();

// 아스팔트 포장의 구성: 단면도의 층에 마우스오버/클릭 시 해당 층만 밝아지고 우측 패널에 상세 정보 표시
(function () {
  const visual = document.getElementById("pavementVisual");
  if (!visual) return;

  const nameEl = document.getElementById("pavementName");
  const specEl = document.getElementById("pavementSpec");
  const descEl = document.getElementById("pavementDesc");
  const indexEl = document.getElementById("pavementIndex");
  const layers = Array.from(visual.querySelectorAll(".pavement-layer"));

  function render(layer, idx) {
    nameEl.textContent = layer.dataset.name;
    specEl.textContent = layer.dataset.spec;
    descEl.textContent = layer.dataset.desc;
    indexEl.textContent = String(idx + 1).padStart(2, "0") + " / " + String(layers.length).padStart(2, "0");
  }

  layers.forEach((layer, idx) => {
    layer.addEventListener("mouseenter", () => render(layer, idx));
    layer.addEventListener("focus", () => render(layer, idx));
    layer.addEventListener("click", () => render(layer, idx));
  });
  visual.addEventListener("mouseleave", () => render(layers[0], 0));

  render(layers[0], 0);
})();
