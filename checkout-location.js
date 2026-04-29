(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CITY_MAP = {
    "California": ["Los Angeles", "San Diego", "San Jose", "Sacramento"],
    "Texas": ["Houston", "Dallas", "Austin", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville"],
    "New York": ["New York", "Buffalo", "Albany", "Rochester"]
  };

  let lastStateValue = null;
  let debounceTimer = null;

  function normalize(value) {
    return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function isCheckoutPage() {
    return !!document.querySelector(".ec-cart, .ec-checkout");
  }

  function findSelectByLabelText(labelText) {
    const wanted = normalize(labelText);
    const labels = Array.from(document.querySelectorAll("label, div, span"));

    for (const node of labels) {
      const text = normalize(node.textContent);

      if (text !== wanted) continue;

      let wrapper = node;

      for (let i = 0; i < 8 && wrapper; i++) {
        const select = wrapper.querySelector("select");
        if (select) return select;

        const nextSelect = wrapper.nextElementSibling?.querySelector?.("select");
        if (nextSelect) return nextSelect;

        wrapper = wrapper.parentElement;
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

  function filterCityOptions() {
    if (!isCheckoutPage()) return;

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) {
      console.log("City filter: state or city select not found");
      return;
    }

    const selectedStateValue = stateSelect.value;
    const selectedStateText =
      stateSelect.options[stateSelect.selectedIndex]?.textContent || "";

    const resolvedKey = CITY_MAP[selectedStateValue]
      ? selectedStateValue
      : Object.keys(CITY_MAP).find(
          key => normalize(key) === normalize(selectedStateText)
        );

    const allowedCities = resolvedKey && CITY_MAP[resolvedKey]
      ? CITY_MAP[resolvedKey].map(normalize)
      : null;

    console.log("City filter running. State:", {
      value: selectedStateValue,
      text: selectedStateText,
      resolvedKey
    });

    Array.from(citySelect.options).forEach(option => {
      if (isPlaceholder(option)) {
        option.hidden = false;
        option.disabled = false;
        option.style.display = "";
        return;
      }

      const cityText = normalize(option.textContent);
      const isAllowed = !allowedCities || allowedCities.includes(cityText);

      option.hidden = !isAllowed;
      option.disabled = !isAllowed;
      option.style.display = isAllowed ? "" : "none";
    });

    const currentOption = citySelect.options[citySelect.selectedIndex];

    if (currentOption && currentOption.disabled) {
      citySelect.value = "";
      citySelect.dispatchEvent(new Event("input", { bubbles: true }));
      citySelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    lastStateValue = stateSelect.value;
  }

  function scheduleFilter() {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(function () {
      filterCityOptions();
    }, 100);
  }

  function checkForStateChange() {
    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);

    if (!stateSelect) return;

    if (stateSelect.value !== lastStateValue) {
      scheduleFilter();
    }
  }

  function start() {
    document.addEventListener("change", scheduleFilter, true);
    document.addEventListener("input", scheduleFilter, true);
    document.addEventListener("click", function () {
      setTimeout(checkForStateChange, 100);
      setTimeout(checkForStateChange, 300);
    }, true);

    const observer = new MutationObserver(function () {
      scheduleFilter();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(filterCityOptions, 300);
    setTimeout(filterCityOptions, 800);
    setTimeout(filterCityOptions, 1500);
    setTimeout(filterCityOptions, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
