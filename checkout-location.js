(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  let boundStateSelect = null;
  let boundCitySelect = null;
  let boundHandler = null;
  let stabilityTimer = null;
  let observer = null;

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isVisible(el) {
    if (!el || !document.contains(el)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    if (el.offsetParent === null && style.position !== "fixed") {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function isCheckoutPage() {
    return !!document.querySelector(".ec-cart, .ec-checkout, .ec-store, .ecwid");
  }

  function findVisibleSelectNearNode(node) {
    let current = node;

    for (let i = 0; i < 7 && current; i += 1) {
      const selects = Array.from(current.querySelectorAll("select")).filter(isVisible);
      if (selects.length === 1) return selects[0];
      if (selects.length > 1) return selects[0];
      current = current.parentElement;
    }

    return null;
  }

  function findSelectByLabelText(labelText) {
    const wanted = normalize(labelText);
    const nodes = Array.from(document.querySelectorAll("label, div, span"));

    for (const node of nodes) {
      const text = normalize(node.textContent);
      if (text !== wanted && !text.includes(wanted)) continue;

      const select = findVisibleSelectNearNode(node);
      if (select) return select;
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

  function resolveStateKey(stateSelect) {
    const selectedStateValue = stateSelect.value;
    const selectedStateText =
      stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    if (CITY_MAP[selectedStateValue]) return selectedStateValue;

    return Object.keys(CITY_MAP).find(
      key => normalize(key) === normalize(selectedStateText)
    ) || null;
  }

  function filterCityOptions(stateSelect, citySelect) {
    const resolvedKey = resolveStateKey(stateSelect);

    const allowedCities = resolvedKey && CITY_MAP[resolvedKey]
      ? CITY_MAP[resolvedKey].map(normalize)
      : null;

    let firstVisible = null;

    Array.from(citySelect.options).forEach(option => {
      if (isPlaceholder(option)) {
        option.hidden = false;
        option.disabled = false;
        option.style.display = "";
        return;
      }

      const cityText = normalize(option.textContent);
      const allowed = !allowedCities || allowedCities.includes(cityText);

      option.hidden = !allowed;
      option.disabled = !allowed;
      option.style.display = allowed ? "" : "none";

      if (allowed && !firstVisible) {
        firstVisible = option;
      }
    });

    const currentOption = citySelect.options[citySelect.selectedIndex];
    const currentInvalid =
      currentOption &&
      !isPlaceholder(currentOption) &&
      (currentOption.hidden || currentOption.disabled || currentOption.style.display === "none");

    if (currentInvalid) {
      citySelect.value = firstVisible ? firstVisible.value : "";
      citySelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function fieldsReady(stateSelect, citySelect) {
    if (!stateSelect || !citySelect) return false;
    if (!isVisible(stateSelect) || !isVisible(citySelect)) return false;
    if (!stateSelect.options || stateSelect.options.length < 2) return false;
    if (!citySelect.options || citySelect.options.length < 1) return false;
    return true;
  }

  function unbindPrevious() {
    if (boundStateSelect && boundHandler) {
      boundStateSelect.removeEventListener("change", boundHandler);
    }
    boundStateSelect = null;
    boundCitySelect = null;
    boundHandler = null;
  }

  function bindFilter(stateSelect, citySelect) {
    const sameBinding =
      boundStateSelect === stateSelect &&
      boundCitySelect === citySelect &&
      boundHandler;

    if (sameBinding) {
      filterCityOptions(stateSelect, citySelect);
      return true;
    }

    unbindPrevious();

    boundHandler = function () {
      filterCityOptions(stateSelect, citySelect);
    };

    boundStateSelect = stateSelect;
    boundCitySelect = citySelect;

    stateSelect.addEventListener("change", boundHandler);
    filterCityOptions(stateSelect, citySelect);

    console.log("City filter bound to current checkout fields");
    return true;
  }

  function initWhenStable() {
    if (!isCheckoutPage()) return;

    let lastState = null;
    let lastCity = null;
    let lastStateOptions = -1;
    let lastCityOptions = -1;
    let stableHits = 0;
    let tries = 0;
    const maxTries = 40;

    if (stabilityTimer) {
      clearInterval(stabilityTimer);
      stabilityTimer = null;
    }

    stabilityTimer = setInterval(function () {
      tries += 1;

      const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
      const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

      if (!fieldsReady(stateSelect, citySelect)) {
        stableHits = 0;
        if (tries >= maxTries) clearInterval(stabilityTimer);
        return;
      }

      const sameRefs = stateSelect === lastState && citySelect === lastCity;
      const sameCounts =
        stateSelect.options.length === lastStateOptions &&
        citySelect.options.length === lastCityOptions;

      if (sameRefs && sameCounts) {
        stableHits += 1;
      } else {
        stableHits = 0;
      }

      lastState = stateSelect;
      lastCity = citySelect;
      lastStateOptions = stateSelect.options.length;
      lastCityOptions = citySelect.options.length;

      if (stableHits >= 2) {
        bindFilter(stateSelect, citySelect);
        clearInterval(stabilityTimer);
        stabilityTimer = null;
      }

      if (tries >= maxTries) {
        bindFilter(stateSelect, citySelect);
        clearInterval(stabilityTimer);
        stabilityTimer = null;
      }
    }, 250);
  }

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver(function () {
      const stateGone = boundStateSelect && !document.contains(boundStateSelect);
      const cityGone = boundCitySelect && !document.contains(boundCitySelect);

      if (!boundStateSelect || !boundCitySelect || stateGone || cityGone) {
        initWhenStable();
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  function start() {
    startObserver();
    initWhenStable();

    setTimeout(initWhenStable, 300);
    setTimeout(initWhenStable, 800);
    setTimeout(initWhenStable, 1500);
    setTimeout(initWhenStable, 2500);
  }

  function startWithEcwidHooks() {
    if (
      window.Ecwid &&
      Ecwid.OnPageLoaded &&
      typeof Ecwid.OnPageLoaded.add === "function"
    ) {
      Ecwid.OnPageLoaded.add(function () {
        start();
      });
      start();
      return;
    }

    let waitCount = 0;
    const waitTimer = setInterval(function () {
      waitCount += 1;

      if (
        window.Ecwid &&
        Ecwid.OnPageLoaded &&
        typeof Ecwid.OnPageLoaded.add === "function"
      ) {
        clearInterval(waitTimer);
        Ecwid.OnPageLoaded.add(function () {
          start();
        });
        start();
      }

      if (waitCount >= 40) {
        clearInterval(waitTimer);
        start();
      }
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWithEcwidHooks);
  } else {
    startWithEcwidHooks();
  }

  window.addEventListener("load", start);
})();
