(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isCheckoutPage() {
    return !!document.querySelector(".ec-cart") || !!document.querySelector(".ec-checkout");
  }

  function findSelectByLabelText(labelText) {
    const wanted = normalize(labelText);
    const nodes = Array.from(document.querySelectorAll("label, div, span"));

    for (const node of nodes) {
      if (normalize(node.textContent) !== wanted) continue;

      let current = node;
      for (let i = 0; i < 6 && current; i++) {
        const selects = current.querySelectorAll("select");
        if (selects.length) return selects[0];
        current = current.parentElement;
      }
    }
    return null;
  }

  function isPlaceholder(option) {
    const text = normalize(option.textContent);
    return (
      !option.value ||
      text.includes("please choose") ||
      text.includes("select") ||
      text.includes("choose")
    );
  }

  function getAllowedCities(stateText) {
    const normalized = normalize(stateText);

    const key = Object.keys(CITY_MAP).find(
      k => normalize(k) === normalized
    );

    return key ? CITY_MAP[key].map(normalize) : null;
  }

  function filterCityOptions(stateSelect, citySelect) {
    if (!stateSelect || !citySelect) return;

    const stateText =
      stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    const allowedCities = getAllowedCities(stateText);

    let firstVisible = null;

    Array.from(citySelect.options).forEach(option => {
      if (isPlaceholder(option)) {
        option.style.display = "";
        return;
      }

      const city = normalize(option.textContent);

      if (!allowedCities || allowedCities.includes(city)) {
        option.style.display = "";
        if (!firstVisible) firstVisible = option;
      } else {
        option.style.display = "none";
      }
    });

    const current = citySelect.options[citySelect.selectedIndex];
    if (current && current.style.display === "none") {
      citySelect.value = firstVisible ? firstVisible.value : "";
      citySelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // 🧠 SINGLE GLOBAL HANDLER (no duplicates ever)
  function attachDelegatedListener() {
    if (window.__ecwidCityFilterAttached) return;
    window.__ecwidCityFilterAttached = true;

    document.addEventListener("change", function (e) {
      const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
      const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

      if (!stateSelect || !citySelect) return;
      if (e.target !== stateSelect) return;

      filterCityOptions(stateSelect, citySelect);
    });
  }

  // 🔁 retry until Ecwid renders fields
  function initWithRetry(retries = 20) {
    if (!isCheckoutPage()) return;

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) {
      if (retries > 0) {
        setTimeout(() => initWithRetry(retries - 1), 300);
      }
      return;
    }

    filterCityOptions(stateSelect, citySelect);
  }

  function observeEcwid() {
    const observer = new MutationObserver(() => {
      initWithRetry();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function start() {
    attachDelegatedListener();
    observeEcwid();
    initWithRetry();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
