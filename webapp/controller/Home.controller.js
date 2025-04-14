sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("ui5.starwarsecommerce.controller.Home", {
      onInit() {
        const oModel = this.getOwnerComponent().getModel("destacados");
        const aProducts = oModel.getProperty("/destacados") || [];

        aProducts.forEach((product) => {
          product.isFavorite = this.isProductFavorite(product);
        });

        oModel.setProperty("/destacados", aProducts);
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

      onAddToCart(oEvent) {
        const oProduct = this.getObjectFromEvent(oEvent, "destacados");
        if (!oProduct || !oProduct.id) {
          showMessage("❌ Producto no disponible.");
          return;
        }

        this.addToCart(oProduct);
        this.getCartTotal();
        showMessage(`${oProduct.name} agregado al carrito 🛒`);
      },

      onToggleFavorite(oEvent) {
        const oProduct = this.getObjectFromEvent(oEvent, "destacados");
        this.toggleFavorite(oProduct, "destacados");

        this.getModel("destacados").setProperty(
          "/isFavorite",
          oProduct.isFavorite
        );
      },

      onRemoveFromCart(oEvent) {
        const oProduct = this.getObjectFromEvent(oEvent, "productModel");
        this.removeFromCart(oProduct.id);
        this.getCartTotal();
      },
    });
  }
);
