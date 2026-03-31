(function () {
  const LOCATIONS = {
    CA: {
      label: "California",
      cities: ["Los Angeles", "San Diego", "San Jose", "Sacramento"]
    },
    TX: {
      label: "Texas",
      cities: ["Houston", "Dallas", "Austin", "San Antonio"]
    },
    FL: {
      label: "Florida",
      cities: ["Miami", "Orlando", "Tampa", "Jacksonville"]
    },
    NY: {
      label: "New York",
      cities: ["New York", "Buffalo", "Albany", "Rochester"]
    }
  };

  const CONFIG = {
    containerId: "custom-location-picker",
    stateSelectId: "custom-state-select",
    citySelectId: "custom-city-select",
    infoId: "custom-location-info",
    labels: {
      wrapperTitle: "Delivery location",
      state: "State",
      city: "City",
      selectState: "Select state",
      selectCity: "Select city",
      emptyCities: "No cities available"
    }
  };

  function initEcwidScript() {
    observeCheckout();
    tryMount();
  }

  function observeCheckout() {
    const observer = new MutationObserver(function () {
      tryMount();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function tryMount() {
    if (document.getElementById(CONFIG.containerId)) {
      return;
    }

    const target = findCheckoutTarget();
    if (!target) {
      return;
    }

    renderLocationUI(target);
  }

  function findCheckoutTarget() {
    return (
      document.querySelector(".ec-cart") ||
      document.querySelector(".ec-checkout") ||
      document.querySelector("[class*='Ecwid']") ||
      document.querySelector("body")
    );
  }

  function renderLocationUI(target) {
    const wrapper = document.createElement("div");
    wrapper.id = CONFIG.containerId;
    wrapper.style.margin = "16px 0";
    wrapper.style.padding = "16px";
    wrapper.style.border = "1px solid #ddd";
    wrapper.style.borderRadius = "8px";
    wrapper.style.background = "#fafafa";

    wrapper.innerHTML = `
      <div style="font-weight:600; margin-bottom:12px;">
        ${escapeHtml(CONFIG.labels.wrapperTitle)}
      </div>

      <div style="display:grid; gap:12px;">
        <div>
          <label for="${CONFIG.stateSelectId}" style="display:block; margin-bottom:6px;">
            ${escapeHtml(CONFIG.labels.state)}
          </label>
          <select id="${CONFIG.stateSelectId}" style="width:100%; padding:8px;">
            <option value="">${escapeHtml(CONFIG.labels.selectState)}</option>
          </select>
        </div>

        <div>
          <label for="${CONFIG.citySelectId}" style="display:block; margin-bottom:6px;">
            ${escapeHtml(CONFIG.labels.city)}
          </label>
          <select id="${CONFIG.citySelectId}" style="width:100%; padding:8px;" disabled>
            <option value="">${escapeHtml(CONFIG.labels.selectCity)}</option>
          </select>
        </div>

        <div id="${CONFIG.infoId}" style="font-size:12px; color:#666;"></div>
      </div>
    `;

    target.prepend(wrapper);

    const stateSelect = document.getElementById(CONFIG.stateSelectId);
    const citySelect = document.getElementById(CONFIG.citySelectId);

    populateStates(stateSelect);

    stateSelect.addEventListener("change", function () {
      const stateCode = this.value;

      resetCitySelect(citySelect);
      setInfo("");

      if (!stateCode) {
        citySelect.disabled = true;
        return;
      }

      const cities = getCitiesForState(stateCode);

      fillCitySelect(citySelect, cities);
      citySelect.disabled = cities.length === 0;

      if (cities.length === 0) {
        setInfo(CONFIG.labels.emptyCities);
      }
    });

    citySelect.addEventListener("change", function () {
      const stateCode = stateSelect.value;
      const city = this.value;

      console.log("Selected location:", {
        state: stateCode,
        city: city
      });

      // Тут далі можна буде додати:
      // sync в shipping address
      // або запис у Ecwid extra field
    });
  }

  function populateStates(select) {
    Object.entries(LOCATIONS).forEach(function ([code, item]) {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = item.label;
      select.appendChild(option);
    });
  }

  function getCitiesForState(stateCode) {
    const state = LOCATIONS[stateCode];
    return state ? state.cities : [];
  }

  function resetCitySelect(select) {
    select.innerHTML = "";

    const option = document.createElement("option");
    option.value = "";
    option.textContent = CONFIG.labels.selectCity;
    select.appendChild(option);
  }

  function fillCitySelect(select, cities) {
    resetCitySelect(select);

    cities.forEach(function (city) {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      select.appendChild(option);
    });
  }

  function setInfo(text) {
    const info = document.getElementById(CONFIG.infoId);
    if (info) {
      info.textContent = text;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function waitForEcwid() {
    if (window.Ecwid && Ecwid.OnAPILoaded && Ecwid.OnAPILoaded.add) {
      Ecwid.OnAPILoaded.add(initEcwidScript);
      return;
    }

    setTimeout(waitForEcwid, 300);
  }

  waitForEcwid();
})();
