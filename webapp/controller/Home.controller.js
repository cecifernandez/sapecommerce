sap.ui.define(
  ["./BaseController"],
  function (BaseController) {
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

      onProductPress(oEvent) {
        const oProduct = this.getObjectFromEvent(oEvent, "destacados");
        this.getRouter().navTo("productDetail", {
          productId: oProduct.id,
        });
      },

      onAddToCart(oEvent) {
        const oProduct = this.getObjectFromEvent(oEvent, "destacados");
        if (!oProduct || !oProduct.id) {
          this.showMessage("❌ Producto no disponible.");
          return;
        }

        this.addToCart(oProduct);
        this.getCartTotal();
        this.showMessage(`${oProduct.name} agregado al carrito 🛒`);
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
