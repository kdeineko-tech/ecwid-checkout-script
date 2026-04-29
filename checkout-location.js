(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const CLUB_LOCATION_DESCRIPTION =
    "Support your local boot camp! Select your home location from the dropdown and they will earn a percentage from your sale.";

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
    return !!document.querySelector(".ec-cart, .ec-checkout");
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
        if (selects.length > 1) return selects[0];

        current = current.parentElement;
      }
    }

    return null;
  }

  function findSharedFieldContainer(stateSelect, citySelect) {
    let current = stateSelect.parentElement;

    while (current && current !== document.body) {
      if (current.contains(stateSelect) && current.contains(citySelect)) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  function addClubLocationDescription(stateSelect, citySelect) {
    const sharedContainer = findSharedFieldContainer(stateSelect, citySelect);
    if (!sharedContainer) return;

    if (sharedContainer.querySelector(".club-location-description")) return;

    const description = document.createElement("div");
    description.className = "club-location-description";
    description.textContent = CLUB_LOCATION_DESCRIPTION;

    description.style.fontSize = "16px";
    description.style.color = "#000";
    description.style.marginBottom = "14px";
    description.style.lineHeight = "1.4";
    description.style.fontWeight = "400";

    sharedContainer.insertBefore(description, sharedContainer.firstChild);
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
      : Object.keys(CITY_MAP).find(
          key => normalize(key) === normalize(selectedStateText)
        );

    const allowedCities =
      resolvedKey && CITY_MAP[resolvedKey]
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

  function applyFieldEnhancements() {
    if (!isCheckoutPage()) return;

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) return;

    addClubLocationDescription(stateSelect, citySelect);
    filterCityOptions(stateSelect, citySelect);
  }

  function start() {
    document.body.addEventListener("change", function (event) {
      const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
      const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

      if (event.target === stateSelect && citySelect) {
        filterCityOptions(stateSelect, citySelect);
      }
    });

    const observer = new MutationObserver(applyFieldEnhancements);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    Ecwid.OnPageLoaded.add(function () {
      applyFieldEnhancements();
    });

    applyFieldEnhancements();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
