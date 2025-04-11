sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("ui5.starwarsecommerce.controller.Home", {
      onInit() {
        // const oProductModel = this.getOwnerComponent().getModel("productModel");
        // if (!oProductModel) {
        //   console.warn("⚠️ No se encontró el modelo 'productModel'.");
        //   return;
        // }
        // const catalog = oProductModel.getData().catalog;
        // const destacados = this.extractProducts(
        //   catalog,
        //   (p) => p.rating >= 4.5
        // );
        // const oDestacadosModel = new JSONModel({ destacados });
        // this.getView().setModel(oDestacadosModel, "destacados");
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

      onProductPress(oEvent) {
        const oProduct = this.getObjectFromEvent(oEvent, "destacados");
        this.getRouter().navTo("productDetail", {
          productId: oProduct.id,
        });
      },
    });
  }
);
