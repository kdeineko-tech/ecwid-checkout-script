(function () {
  const STATE_FIELD_LABEL = "Choose State";
  const CITY_FIELD_LABEL = "Choose City";

  const STATE_FIELD_DESCRIPTION =
    "Select the state of your club location.";

  const CITY_FIELD_DESCRIPTION =
    "Select your club city. Available options update after choosing a state.";

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
    return (
      !!document.querySelector(".ec-cart") ||
      !!document.querySelector(".ec-checkout")
    );
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

  function findFieldLabelNode(labelText, select) {
    const wanted = normalize(labelText);

    let current = select;

    for (let i = 0; i < 6 && current; i += 1) {
      const labelNode = Array.from(
        current.querySelectorAll("label, div, span")
      ).find(node => normalize(node.textContent) === wanted);

      if (labelNode) return labelNode;

      current = current.parentElement;
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

  function addFieldDescription(labelText, descriptionText) {
    const select = findSelectByLabelText(labelText);
    if (!select) return;

    const labelNode = findFieldLabelNode(labelText, select);
    if (!labelNode) return;

    const fieldContainer =
      select.closest(".ec-form__cell") ||
      select.closest(".form-control") ||
      select.parentElement;

    if (!fieldContainer) return;

    if (fieldContainer.querySelector(".custom-field-description")) return;

    const description = document.createElement("div");
    description.className = "custom-field-description";
    description.textContent = descriptionText;

    description.style.fontSize = "14px";
    description.style.color = "#000";
    description.style.marginTop = "6px";
    description.style.marginBottom = "10px";
    description.style.lineHeight = "1.4";
    description.style.fontWeight = "400";

    labelNode.insertAdjacentElement("afterend", description);
  }

  function filterCityOptions(stateSelect, citySelect) {
    if (!stateSelect || !citySelect) return;

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

        if (!firstVisible) {
          firstVisible = option;
        }
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

    addFieldDescription(STATE_FIELD_LABEL, STATE_FIELD_DESCRIPTION);
    addFieldDescription(CITY_FIELD_LABEL, CITY_FIELD_DESCRIPTION);

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

    const observer = new MutationObserver(function () {
      applyFieldEnhancements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    applyFieldEnhancements();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
