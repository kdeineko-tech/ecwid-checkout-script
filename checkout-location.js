(function () {
  const CITY_FIELD_LABEL = "Support your local Fit Body";
  const CITY_FIELD_DESCRIPTION = "Select your home location from the dropdown, and they will earn a percentage from your sale.";

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

  function applyFieldEnhancements() {
    const citySelect = findSelectByLabelText(CITY_FIELD_LABEL);

    if (!citySelect) return;

    addFieldDescription(CITY_FIELD_LABEL, CITY_FIELD_DESCRIPTION);
  }

  function start() {
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
