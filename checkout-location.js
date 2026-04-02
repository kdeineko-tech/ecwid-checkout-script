(function () {
  const LOCATIONS = {
    CA: { label: "California", cities: ["Los Angeles", "San Diego", "San Jose", "Sacramento"] },
    TX: { label: "Texas", cities: ["Houston", "Dallas", "Austin", "San Antonio"] },
    FL: { label: "Florida", cities: ["Miami", "Orlando", "Tampa", "Jacksonville"] },
    NY: { label: "New York", cities: ["New York", "Buffalo", "Albany", "Rochester"] }
    // Додайте інші штати та міста за необхідністю
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
    if (!isCheckoutPage()) {
      const existing = document.getElementById(CONFIG.containerId);
      if (existing) {
        existing.remove();
      }
      return;
    }

    const existing = document.getElementById(CONFIG.containerId);
    if (existing) {
      return;
    }

    const target = findCheckoutTarget();
    if (!target) {
      return;
    }

    renderLocationUI(target);
  }

  function findCheckoutTarget() {
    return document.querySelector(".ec-cart") || document.querySelector(".ec-checkout");
  }

  function isCheckoutPage() {
    return window.location.href.includes("#!/~/cart") || !!document.querySelector(".ec-cart") || !!document.querySelector(".ec-checkout");
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
      console.log("State selected:", stateCode);

      resetCitySelect(citySelect);
      setInfo("");

      if (!stateCode) {
        citySelect.disabled = true;
        return;
      }

      const cities = LOCATIONS[stateCode] ? LOCATIONS[stateCode].cities : [];
      fillCitySelect(citySelect, cities);
      citySelect.disabled = cities.length === 0;

      if (cities.length === 0) {
        setInfo(CONFIG.labels.emptyCities);
      }

      // Передача значень в поля Ecwid для shipping address
      setEcwidCheckoutFields(stateCode, citySelect.value);
    });

    citySelect.addEventListener("change", function () {
      const city = this.value;
      console.log("City selected:", city);

      // Передача значень у Ecwid при виборі міста
      setEcwidCheckoutFields(stateSelect.value, city);
    });
  }

  function setEcwidCheckoutFields(state, city) {
    // Встановлюємо значення в кастомні поля Ecwid
    Ecwid.Cart.get(function(cart) {
      const shippingAddress = cart.shippingPerson || {};

      // Оновлюємо кастомні поля для State і City
      shippingAddress["customFields"] = shippingAddress["customFields"] || {};
      shippingAddress.customFields["state"] = state;
      shippingAddress.customFields["city"] = city;

      Ecwid.Cart.setAddress(shippingAddress, function() {
        console.log("Shipping address updated with state and city");
      });
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

  document.addEventListener("DOMContentLoaded", function () {
    const target = document.querySelector(".ec-cart"); // Це селектор для сторінки checkout
    if (target) {
      renderLocationUI(target);
    }
  });
})();
