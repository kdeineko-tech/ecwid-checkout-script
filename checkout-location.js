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
      for (let i = 0; i < 5 && current; i += 1) {
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

  function filterCityOptions(stateSelect, citySelect) {
    const selectedStateValue = stateSelect.value;
    const selectedStateText =
      stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    const resolvedKey = CITY_MAP[selectedStateValue]
      ? selectedStateValue
      : Object.keys(CITY_MAP).find(k => normalize(k) === normalize(selectedStateText));

    console.log(`Filtering cities for state: ${resolvedKey}`);

    const allowedCities = resolvedKey && CITY_MAP[resolvedKey]
      ? CITY_MAP[resolvedKey].map(normalize)
      : null;

    let firstVisible = null;

    Array.from(citySelect.options).forEach(option => {
      if (isPlaceholder(option)) {
        option.style.display = "";
        return;
      }

      const cityText = normalize(option.textContent);

      if (!allowedCities || allowedCities.includes(cityText)) {
        option.style.display = "";
        if (!firstVisible) firstVisible = option;
      } else {
        option.style.display = "none";
      }
    });

    const currentOption = citySelect.options[citySelect.selectedIndex];
    if (currentOption && currentOption.style.display === "none") {
      citySelect.value = firstVisible ? firstVisible.value : "";
      citySelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function start() {
    if (!isCheckoutPage()) return;

    // ✅ 1. EVENT DELEGATION (ключове виправлення)
    document.body.addEventListener("change", function (event) {
      const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
      const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

      if (!stateSelect || !citySelect) return;

      if (event.target === stateSelect) {
        console.log("State change detected via delegation");
        filterCityOptions(stateSelect, citySelect);
      }
    });

    // ✅ 2. OBSERVER тільки для initial load
    const observer = new MutationObserver(function () {
      const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
      const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

      if (!stateSelect || !citySelect) return;

      if (citySelect.dataset.cityFilterInitialized !== "1") {
        citySelect.dataset.cityFilterInitialized = "1";

        filterCityOptions(stateSelect, citySelect);

        console.log("Initial load filter applied");
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

})();
