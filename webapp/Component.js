sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"],
  function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("ui5.starwarsecommerce.Component", {
      metadata: {
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
        manifest: "json",
      },

      init() {
        // Llama al init del padre
        UIComponent.prototype.init.apply(this, arguments);
        this.getRouter().initialize();

        const storedFavorites =
          JSON.parse(localStorage.getItem("favorites")) || [];

        const storedCart =
          JSON.parse(localStorage.getItem("purchaseHistory")) || [];

        let oUserModel = new JSONModel({
          avatar: "https://i.imgur.com/3GvwNBf.png",
          name: "Leia Organa",
          username: "leia",
          mail: "leia@rebellion.org",
          favorites: storedFavorites,
          reviews: [],
          purchaseHistory: storedCart,
          filteredPurchaseHistory: [],
        });
        this.setModel(oUserModel, "userModel");
      },
    });
  }
);

//index.js para que no tengamos codigo ejecutable en el html, por seguridad
//mapping vista y controlador, atributos
