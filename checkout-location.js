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

  // A helper function to force React to recognize a programmatic value change
  function setReactInputValue(element, value) {
    const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      "value"
    ).set;
    nativeSelectValueSetter.call(element, value);
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function filterCityOptions(stateSelect, citySelect) {
    const selectedStateValue = stateSelect.value;
    const selectedStateText =
      stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    const resolvedKey = CITY_MAP[selectedStateValue]
      ? selectedStateValue
      : Object.keys(CITY_MAP).find((k) => normalize(k) === normalize(selectedStateText));

    console.log(`[CityFilter] Filtering cities for state: ${resolvedKey || "Unknown"}`);

    const allowedCities = resolvedKey && CITY_MAP[resolvedKey]
      ? CITY_MAP[resolvedKey].map(normalize)
      : null;

    let firstVisible = null;
    let currentSelectionIsValid = false;

    Array.from(citySelect.options).forEach((option) => {
      if (isPlaceholder(option)) {
        option.style.display = "";
        option.hidden = false;
        option.disabled = false;
        return;
      }

      const cityText = normalize(option.textContent);

      if (!allowedCities || allowedCities.includes(cityText)) {
        // Show option
        option.style.display = "";
        option.hidden = false;
        option.disabled = false;
        if (!firstVisible) firstVisible = option;
        if (citySelect.value === option.value) currentSelectionIsValid = true;
      } else {
        // Hide and disable option
        option.style.display = "none";
        option.hidden = true;
        option.disabled = true;
      }
    });

    // If the currently selected city is now hidden, we MUST force a change
    // using the React-safe setter so Ecwid knows about it.
    if (!currentSelectionIsValid) {
      const newValue = firstVisible ? firstVisible.value : "";
      console.log(`[CityFilter] Forcing city value to: ${newValue}`);
      setReactInputValue(citySelect, newValue);
    }
  }

  function start() {
    console.log("[CityFilter] Script initialized.");

    // 1. Use capture phase (true) to catch the event before React can swallow it
    document.body.addEventListener(
      "change",
      function (event) {
        if (!isCheckoutPage()) return;

        const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
        const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

        // Check if the element that triggered the change is our state select
        if (stateSelect && event.target === stateSelect && citySelect) {
          console.log("[CityFilter] State change detected via delegation!");
          filterCityOptions(stateSelect, citySelect);
        }
      },
      true // <--- TRUE forces it into the capture phase
    );

    // 2. Observer for initial load and React re-renders
    const observer = new MutationObserver(function () {
      if (!isCheckoutPage()) return;

      const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
      const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

      if (stateSelect && citySelect && citySelect.dataset.cityFilterInitialized !== "1") {
        citySelect.dataset.cityFilterInitialized = "1";
        console.log("[CityFilter] Initial load filter applied via observer.");
        filterCityOptions(stateSelect, citySelect);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
