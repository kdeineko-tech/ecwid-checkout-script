(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
    Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  const CHECKOUT_PAGE_TYPES = new Set([
    "CART",
    "CHECKOUT_ADDRESS",
    "CHECKOUT_DELIVERY",
    "CHECKOUT_ADDRESS_BOOK",
    "CHECKOUT_PAYMENT_DETAILS"
  ]);

  let initInterval = null;
  let lastBoundStateSelect = null;
  let lastBoundCitySelect = null;

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isCheckoutPageByDom() {
    return !!document.querySelector(".ec-cart, .ec-checkout, .ec-store, .ecwid");
  }

  function labelMatches(nodeText, expectedText) {
    const actual = normalize(nodeText);
    const expected = normalize(expectedText);
    return actual === expected || actual.includes(expected);
  }

  function findSelectByLabelText(labelText) {
    const candidates = Array.from(document.querySelectorAll("label, div, span"));

    for (const node of candidates) {
      if (!labelMatches(node.textContent, labelText)) continue;

      let current = node;
      for (let i = 0; i < 7 && current; i += 1) {
        const selects = current.querySelectorAll("select");
        if (selects.length === 1) return selects[0];
        if (selects.length > 1) return selects[0];
        current = current.parentElement;
      }
    }

    return null;
  }

  function isPlaceholderOptionData(optionLike) {
    const text = normalize(optionLike.text || optionLike.textContent || "");
    const value = optionLike.value || "";
    return (
      !value ||
      text.includes("choose") ||
      text.includes("select") ||
      text.includes("please choose")
    );
  }

  function getResolvedStateKey(stateSelect) {
    if (!stateSelect) return null;

    const selectedValue = stateSelect.value || "";
    const selectedText =
      stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    if (CITY_MAP[selectedValue]) return selectedValue;

    return Object.keys(CITY_MAP).find(
      key =>
        normalize(key) === normalize(selectedValue) ||
        normalize(key) === normalize(selectedText)
    ) || null;
  }

  function cacheOriginalCityOptions(citySelect) {
    if (!citySelect) return [];

    if (!citySelect._originalCityOptions || !citySelect._originalCityOptions.length) {
      citySelect._originalCityOptions = Array.from(citySelect.options).map(option => ({
        value: option.value,
        text: option.textContent,
        selected: option.selected
      }));
    }

    return citySelect._originalCityOptions;
  }

  function rebuildCityOptions(stateSelect, citySelect) {
    const originalOptions = cacheOriginalCityOptions(citySelect);
    if (!originalOptions.length) return;

    const currentValue = citySelect.value;
    const resolvedStateKey = getResolvedStateKey(stateSelect);

    const allowedCities = resolvedStateKey
      ? new Set(CITY_MAP[resolvedStateKey].map(normalize))
      : null;

    const filteredOptions = originalOptions.filter(option => {
      if (isPlaceholderOptionData(option)) return true;
      if (!allowedCities) return true;
      return allowedCities.has(normalize(option.text));
    });

    citySelect.innerHTML = "";

    filteredOptions.forEach(optionData => {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.text;
      citySelect.appendChild(option);
    });

    const hasPreviousValue = filteredOptions.some(opt => opt.value === currentValue);
    const firstRealOption = filteredOptions.find(opt => !isPlaceholderOptionData(opt));
    const placeholderOption = filteredOptions.find(opt => isPlaceholderOptionData(opt));

    if (hasPreviousValue) {
      citySelect.value = currentValue;
    } else if (placeholderOption) {
      citySelect.value = placeholderOption.value;
    } else if (firstRealOption) {
      citySelect.value = firstRealOption.value;
    } else {
      citySelect.value = "";
    }

    citySelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fieldsAreReady(stateSelect, citySelect) {
    if (!stateSelect || !citySelect) return false;
    if (!stateSelect.options || stateSelect.options.length < 2) return false;
    if (!citySelect.options || citySelect.options.length < 1) return false;
    return true;
  }

  function bindFilter(stateSelect, citySelect) {
    if (
      lastBoundStateSelect === stateSelect &&
      lastBoundCitySelect === citySelect
    ) {
      rebuildCityOptions(stateSelect, citySelect);
      return;
    }

    if (lastBoundStateSelect && lastBoundStateSelect._cityFilterHandler) {
      lastBoundStateSelect.removeEventListener(
        "change",
        lastBoundStateSelect._cityFilterHandler
      );
    }

    const handler = function () {
      rebuildCityOptions(stateSelect, citySelect);
    };

    stateSelect.addEventListener("change", handler);
    stateSelect._cityFilterHandler = handler;

    lastBoundStateSelect = stateSelect;
    lastBoundCitySelect = citySelect;

    rebuildCityOptions(stateSelect, citySelect);
    console.log("Ecwid city filter bound");
  }

  function tryInit() {
    if (!isCheckoutPageByDom()) return false;

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) {
      console.log("State or City select not found yet");
      return false;
    }

    if (!fieldsAreReady(stateSelect, citySelect)) {
      console.log("State or City select found, but not ready yet");
      return false;
    }

    bindFilter(stateSelect, citySelect);
    return true;
  }

  function startInitAttempts() {
    if (initInterval) {
      clearInterval(initInterval);
      initInterval = null;
    }

    let attempts = 0;
    const maxAttempts = 40;

    const run = function () {
      attempts += 1;

      const ready = tryInit();
      if (ready || attempts >= maxAttempts) {
        clearInterval(initInterval);
        initInterval = null;
      }
    };

    run();
    initInterval = setInterval(run, 250);

    setTimeout(run, 300);
    setTimeout(run, 700);
    setTimeout(run, 1200);
    setTimeout(run, 2000);
    setTimeout(run, 3000);
  }

  function onEcwidPageLoaded(page) {
    if (!page || !page.type) {
      startInitAttempts();
      return;
    }

    if (CHECKOUT_PAGE_TYPES.has(page.type)) {
      startInitAttempts();
    }
  }

  function connectEcwidEvents() {
    if (
      window.Ecwid &&
      Ecwid.OnPageLoaded &&
      typeof Ecwid.OnPageLoaded.add === "function"
    ) {
      Ecwid.OnPageLoaded.add(onEcwidPageLoaded);
      startInitAttempts();
      return true;
    }

    return false;
  }

  function start() {
    if (!connectEcwidEvents()) {
      let tries = 0;
      const waitEcwid = setInterval(function () {
        tries += 1;
        if (connectEcwidEvents() || tries > 40) {
          clearInterval(waitEcwid);
          startInitAttempts();
        }
      }, 250);
    }

    const observer = new MutationObserver(function () {
      if (
        !lastBoundStateSelect ||
        !document.contains(lastBoundStateSelect) ||
        !lastBoundCitySelect ||
        !document.contains(lastBoundCitySelect)
      ) {
        startInitAttempts();
      }
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    startInitAttempts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  window.addEventListener("load", startInitAttempts);
})();
