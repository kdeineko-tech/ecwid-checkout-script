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
      : Object.keys(CITY_MAP).find(
          k => normalize(k) === normalize(selectedStateText)
        );

    console.log("Filtering cities for state:", resolvedKey);

    const allowedCities = resolvedKey && CITY_MAP[resolvedKey]
      ? CITY_MAP[resolvedKey].map(normalize)
      : null;

    let firstVisible = null;

    Array.from(citySelect.options).forEach(option => {
      if (isPlaceholder(option)) {
        option.style.display = "";
        option.hidden = false;
        option.disabled = false;
        return;
      }

      const cityText = normalize(option.textContent);

      if (!allowedCities || allowedCities.includes(cityText)) {
        option.style.display = "";
        option.hidden = false;
        option.disabled = false;
        if (!firstVisible) firstVisible = option;
      } else {
        option.style.display = "none";
        option.hidden = true;
        option.disabled = true;
      }
    });

    const currentOption = citySelect.options[citySelect.selectedIndex];
    if (
      currentOption &&
      (currentOption.style.display === "none" || currentOption.hidden || currentOption.disabled)
    ) {
      citySelect.value = firstVisible ? firstVisible.value : "";
      citySelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function initCityFilter() {
    const stateSelect = findSelectByLabelText(STATE_FIELD_LABEL);
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!stateSelect || !citySelect) {
      console.log("State or City field not found yet");
      return false;
    }

    if (stateSelect.options.length < 2 || citySelect.options.length < 1) {
      console.log("Fields found but options are not ready yet");
      return false;
    }

    if (
      stateSelect.dataset.cityFilterBound === "1" &&
      citySelect.dataset.cityFilterBound === "1"
    ) {
      filterCityOptions(stateSelect, citySelect);
      return true;
    }

    stateSelect.dataset.cityFilterBound = "1";
    citySelect.dataset.cityFilterBound = "1";

    stateSelect.addEventListener("change", function () {
      filterCityOptions(stateSelect, citySelect);
    });

    filterCityOptions(stateSelect, citySelect);

    console.log("City filter initialized");
    return true;
  }

  function runInitAttempts() {
    let tries = 0;
    const maxTries = 25;

    const timer = setInterval(function () {
      tries += 1;
      const success = initCityFilter();

      if (success || tries >= maxTries) {
        clearInterval(timer);
      }
    }, 300);

    setTimeout(initCityFilter, 200);
    setTimeout(initCityFilter, 600);
    setTimeout(initCityFilter, 1200);
    setTimeout(initCityFilter, 2000);
  }

  function startWithEcwid() {
    if (
      window.Ecwid &&
      Ecwid.OnAPILoaded &&
      typeof Ecwid.OnAPILoaded.add === "function"
    ) {
      Ecwid.OnAPILoaded.add(function () {
        if (
          Ecwid.OnPageLoaded &&
          typeof Ecwid.OnPageLoaded.add === "function"
        ) {
          Ecwid.OnPageLoaded.add(function (page) {
            const checkoutPages = [
              "CART",
              "CHECKOUT_ADDRESS",
              "CHECKOUT_DELIVERY",
              "CHECKOUT_PAYMENT_DETAILS",
              "CHECKOUT_ADDRESS_BOOK"
            ];

            if (!page || checkoutPages.includes(page.type)) {
              runInitAttempts();
            }
          });
        }

        runInitAttempts();
      });
    } else {
      // fallback, якщо Ecwid API ще не готовий
      let waitCount = 0;
      const waitTimer = setInterval(function () {
        waitCount += 1;

        if (
          window.Ecwid &&
          Ecwid.OnAPILoaded &&
          typeof Ecwid.OnAPILoaded.add === "function"
        ) {
          clearInterval(waitTimer);
          startWithEcwid();
        }

        if (waitCount >= 40) {
          clearInterval(waitTimer);
          runInitAttempts();
        }
      }, 250);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWithEcwid);
  } else {
    startWithEcwid();
  }
})();
