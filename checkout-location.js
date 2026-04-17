const locationData = {
  "CA": ["San Francisco", "Los Angeles", "San Diego"],
  "NY": ["Manhattan", "Brooklyn", "Albany"]
};

function updateLocationField(selectedState) {
  const locations =
    locationData[selectedState] || ["Please select a state first"];

  Ecwid.refreshConfig({
    checkoutCustomFields: [
      {
        id: "franchise_location_selector",
        title: "Select Your Location",
        type: "select",
        options: locations.map((loc) => ({
          title: loc,
          value: loc
        })),
        required: true,
        checkoutDisplaySection: "shipping_address" // Forces placement in Shipping
      }
    ]
  });
}
