(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    California: ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    Texas: ["Houston", "Dallas", "Austin", "San Antonio"],
    Florida: ["Miami", "Orlando", "Tampa", "Jacksonville"],
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
      for (let i = 0; i < 6 && current; i += 1) {
        const selects = current.querySelectorAll("select");

        if (selects.length === 1) return selects[0];

        if (selects.length > 1) {
          for (const select of selects) {
            const relation = node.compareDocumentPosition(select);
            if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
              return select;
            }
          }
          return selects[0];
        }

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

  function getResolvedStateKey(stateSelect) {
    const selectedValue = stateSelect.value;
    const selectedText = stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    if (CITY_MAP[selectedValue]) return selectedValue;

    return Object.keys(CITY_MAP).find(
      key => normalize(key) === normalize(selectedText)
    );
  }

  function resetCityOptions(citySelect) {
    Array.from(citySelect.options).forEach(option => {
      option.hidden = false;
      option.disabled = false;
      option.style.display = "";
    });
  }

  function filterCityOptions(stateSelect, citySelect) {
    const resolvedKey = getResolvedStateKey(stateSelect);

    const allowedCities = resolvedKey
      ? CITY_MAP[resolvedKey].map(normalize)
      : null;

    let firstVisibleValue = "";

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

      if (allowed && !firstVisibleValue) {
        firstVisibleValue = option.value;
      }
    });

    const currentOption = citySelect.options[citySelect.selectedIndex];
    const currentInvalid =
      currentOption &&
      !isPlaceholder(currentOption) &&
      (currentOption.hidden || currentOption.disabled || currentOption.style.display === "none");

    if (currentInvalid) {
      citySelect.value = firstVisibleValue || "";
      citySelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function areFieldsReady(stateSelect, citySelect) {
    if (!stateSelect || !citySelect) return false;
    if (stateSelect.options.length < 2) return false;
    if (citySelect.options.length < 1) return false;
    return true;
  }

  function bindFilter(stateSelect, citySelect) {
    const stateKey = stateSelect;
    const cityKey = citySelect;

    if (
      stateKey.dataset.cityFilterBound === "1" &&
      cityKey.dataset.cityFilterBound === "1"
    ) {
      return;
    }

    stateKey.dataset.cityFilterBound = "1";
    cityKey.dataset.cityFilterBound = "1";

    stateSelect.addEventListener("change", function () {
      filterCityOptions(stateSelect, citySelect);
    });

    filterCityOptions(stateSelect, citySelect);

    console.log("City filter initialized");
  }

  function initCityFilter() {
    if (!isCheckoutPage()) return;

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) {
      console.log("State or City field not found yet");
      return;
    }

    if (!areFieldsReady(stateSelect, citySelect)) {
      console.log("Fields found but not ready yet");
      return;
    }

    resetCityOptions(citySelect);
    bindFilter(stateSelect, citySelect);
    filterCityOptions(stateSelect, citySelect);
  }

  const observer = new MutationObserver(() => {
    initCityFilter();
  });

  function start() {
    if (!document.body) return;

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    initCityFilter();

    setTimeout(initCityFilter, 300);
    setTimeout(initCityFilter, 800);
    setTimeout(initCityFilter, 1500);
    setTimeout(initCityFilter, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  window.addEventListener("load", function () {
    initCityFilter();
    setTimeout(initCityFilter, 500);
  });
})();
