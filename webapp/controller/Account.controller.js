sap.ui.define(["./BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("ui5.starwarsecommerce.controller.Account", {
    onInit() {},

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
