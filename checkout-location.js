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

  let observerStarted = false;
  let ecwidHookStarted = false;
  let pollingTimer = null;

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

      for (let i = 0; i < 7 && current; i += 1) {
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

  function findLabelNode(labelText, select) {
    const wanted = normalize(labelText);
    let current = select;

    for (let i = 0; i < 8 && current; i += 1) {
      const labelNode = Array.from(
        current.querySelectorAll("label, div, span")
      ).find(node => normalize(node.textContent) === wanted);

      if (labelNode) return labelNode;

      current = current.parentElement;
    }

    return null;
  }

  function removeDuplicateDescriptions() {
    const descriptions = Array.from(
      document.querySelectorAll(".club-location-description")
    );

    descriptions.slice(1).forEach(node => node.remove());
  }

  function addClubLocationDescription(stateSelect) {
    const labelNode = findLabelNode(STATE_FIELD_LABEL, stateSelect);
    if (!labelNode) return false;

    const alreadyExists = document.querySelector(".club-location-description");

    if (alreadyExists && document.body.contains(alreadyExists)) {
      removeDuplicateDescriptions();
      return true;
    }

    const description = document.createElement("div");
    description.className = "club-location-description";
    description.textContent = CLUB_LOCATION_DESCRIPTION;

    description.style.fontSize = "16px";
    description.style.color = "#000";
    description.style.marginBottom = "14px";
    description.style.lineHeight = "1.4";
    description.style.fontWeight = "400";

    labelNode.insertAdjacentElement("beforebegin", description);

    return true;
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
    if (!stateSelect || !citySelect) return false;

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

    return true;
  }

  function applyFieldEnhancements() {
    if (!isCheckoutPage()) return false;

    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) return false;

    addClubLocationDescription(stateSelect);
    filterCityOptions(stateSelect, citySelect);

    return true;
  }

  function startPolling() {
    if (pollingTimer) clearInterval(pollingTimer);

    let attempts = 0;

    pollingTimer = setInterval(function () {
      attempts += 1;

      const applied = applyFieldEnhancements();

      if (applied || attempts >= 80) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    }, 250);
  }

  function startObserver() {
    if (observerStarted) return;
    observerStarted = true;

    const observer = new MutationObserver(function () {
      applyFieldEnhancements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function startDelegatedChangeListener() {
    document.body.addEventListener("change", function (event) {
      const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
      const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

      if (event.target === stateSelect && citySelect) {
        filterCityOptions(stateSelect, citySelect);
      }
    });
  }

  function startEcwidHookWhenReady() {
    if (ecwidHookStarted) return;

    const waitForEcwid = setInterval(function () {
      if (!window.Ecwid || !Ecwid.OnPageLoaded) return;

      clearInterval(waitForEcwid);
      ecwidHookStarted = true;

      Ecwid.OnPageLoaded.add(function (page) {
        if (
          page &&
          String(page.type || "").toUpperCase().includes("CHECKOUT")
        ) {
          startPolling();
        }
      });
    }, 250);
  }

  function start() {
    startDelegatedChangeListener();
    startObserver();
    startEcwidHookWhenReady();

    applyFieldEnhancements();
    startPolling();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
