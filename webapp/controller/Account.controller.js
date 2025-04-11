sap.ui.define(["./BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("ui5.starwarsecommerce.controller.Account", {
    onInit() {
      const oUserModel = this.getUserModel();

      console.log("UserModel:", oUserModel);
      // Recuperar favoritos del localStorage
      const sFavorites = localStorage.getItem("favorites");
      if (sFavorites) {
        const aFavorites = JSON.parse(sFavorites);
        oUserModel.setProperty("/favorites", aFavorites);
      }

      // Recuperar historial de compras del localStorage (opcional)
      const sHistory = localStorage.getItem("purchaseHistory");
      if (sHistory) {
        const aHistory = JSON.parse(sHistory);
        oUserModel.setProperty("/purchaseHistory", aHistory);
      }
    },

    onNavToHome() {
      this.navTo("home");
    },
    onNavToProducts() {
      this.navTo("productsList");
    },
    onNavToAccount() {
      this.navTo("account");
    },
  });
});
