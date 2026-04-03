// Helper to get button styling based on shop branding
export const getButtonStyle = (shop) => {
  if (!shop) return {};
  
  // Good Coffee (ID = 2) - Black buttons with gold text
  if (shop.id === 2) {
    return {
      backgroundColor: "#000000",
      borderColor: "#FFD700",
      color: "#FFD700"
    };
  }
  
  // Other shops - use brand color
  return {
    backgroundColor: shop.brand_color || "#073dbe"
  };
};

// Helper to get button border style
export const getButtonBorderStyle = (shop) => {
  if (!shop) return {};
  
  if (shop.id === 2) {
    return {
      borderColor: "#FFD700",
      borderWidth: "2px"
    };
  }
  
  return {};
};

// Helper to get text color
export const getButtonTextColor = (shop) => {
  if (!shop) return "white";
  
  if (shop.id === 2) {
    return "#FFD700";
  }
  
  return "white";
};
