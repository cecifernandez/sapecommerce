sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/Fragment"],
  function (BaseController, JSONModel, Fragment) {
    "use strict";

    return BaseController.extend(
      "ui5.starwarsecommerce.controller.ProductList",
      {
        onInit() {
          const oRouter = this.getRouter();
          // Registrar rutas
          oRouter
            .getRoute("productsByCategory")
            .attachPatternMatched(this._onCategoryMatched, this);
          oRouter
            .getRoute("productsList")
            .attachPatternMatched(this._onAllProductsMatched, this);
          oRouter
            .getRoute("productsBySubcategory")
            .attachPatternMatched(this._onSubcategoryMatched, this);

          // const oData = this.getProductModel().getData();

          // const aProducts = this.extractProducts(oData.catalog);
          // this.setJSONModel({ products: aProducts }, "products");
        },

        // ───── Navegación ─────────────────────────────────────────────
        onNavToHome() {
          this.navTo("home");
        },

        onNavToProducts() {
          this.navTo("productsList");
          this.setJSONModel({ subcategories: [] }, "subcategories");
        },

        onNavToAccount() {
          this.navTo("account");
        },

        // ───── Carrito ───────────────────────────────────────────────
        onAddToCart(oEvent) {
          const oProduct = this.getObjectFromEvent(oEvent, "products");
          this.addToCart(oProduct);
          this.getCartTotal();
        },

        onRemoveFromCart(oEvent) {
          const oProduct = this.getObjectFromEvent(oEvent, "productModel");
          this.removeFromCart(oProduct.id);
          this.getCartTotal();
        },

        onCheckout() {
          const oProductModel = this.getProductModel();
          const oUserModel = this.getUserModel();

          const aCartItems = this._getCartItems(oProductModel);
          const sTotal = this._getCartTotal(oProductModel);

          if (!this._hasItems(aCartItems)) {
            sap.m.MessageToast.show("Tu carrito está vacío 🛒");
            return;
          }

          const oNewPurchase = this._createPurchase(aCartItems, sTotal);
          this._savePurchase(oUserModel, oNewPurchase);

          this._clearCart(oProductModel);
          sap.m.MessageToast.show("¡Compra realizada con éxito! 🎉");
          this.navTo("account");
        },
        // ───── Productos y Filtros ───────────────────────────────────
        _onCategoryMatched(oEvent) {
          const sCategory = decodeURIComponent(
            oEvent.getParameter("arguments").category
          );
          this._selectedCategory = { name: sCategory };

          const oData = this.getProductModel().getData();

          const aCategoryProducts = this.extractProducts(
            oData.catalog,
            (p) => p.category.toLowerCase() === sCategory.toLowerCase()
          );

          const aMarked = this.markFavorites(aCategoryProducts);
          this.setJSONModel({ products: aMarked }, "products");

          const aSubcategories = this.getSubcategoriesByCategoryName(
            oData.catalog,
            sCategory
          );
          this.setJSONModel({ subcategories: aSubcategories }, "subcategories");
        },

        _onSubcategoryMatched(oEvent) {
          const sCategory = decodeURIComponent(
            oEvent.getParameter("arguments").category
          );
          const sSubcategory = decodeURIComponent(
            oEvent.getParameter("arguments").subcategory
          );

          const oData = this.getProductModel().getData();

          const aFiltered = this.extractProducts(
            oData.catalog,
            (product) =>
              product.category.toLowerCase() === sCategory.toLowerCase() &&
              product.subcategory &&
              product.subcategory.toLowerCase() === sSubcategory.toLowerCase()
          );

          const aMarked = this.markFavorites(aFiltered);
          this.setJSONModel({ products: aMarked }, "products");

          const aSubcategories = this.getSubcategoriesByCategoryName(
            oData.catalog,
            sCategory
          );
          this.setJSONModel({ subcategories: aSubcategories }, "subcategories");
        },

        _onAllProductsMatched() {
          const oData = this.getProductModel().getData();
          const aProducts = this.extractProducts(oData.catalog);
          const aMarkedProducts = this.markFavorites(aProducts);
          this.setJSONModel({ products: aMarkedProducts }, "products");
        },

        onProductPress(oEvent) {
          const oProduct = this.getObjectFromEvent(oEvent, "products");
          this.getRouter().navTo("productDetail", {
            productId: oProduct.id,
          });
        },

        onSubcategorySelect(oEvent) {
          const sSubcategory = oEvent.getSource().getText();
          const sCategory = this._selectedCategory.name;

          this.getRouter().navTo("productsBySubcategory", {
            category: encodeURIComponent(sCategory),
            subcategory: encodeURIComponent(sSubcategory),
          });
        },

        // ───── Favoritos ─────────────────────────────────────────────
        onToggleFavorite(oEvent) {
          const oProduct = this.getObjectFromEvent(oEvent, "products");
          this.toggleFavorite(oProduct);

          const oProductsModel = this.getModel("products");
          const aProducts = oProductsModel.getProperty("/products") || [];
          const iIndex = aProducts.findIndex((p) => p.id === oProduct.id);
          if (iIndex !== -1) {
            oProductsModel.setProperty(
              `/products/${iIndex}/isFavorite`,
              oProduct.isFavorite
            );
          }
        },

        // ───── Helpers ───────────────────────────────────────────────

        onShowMessage() {
          sap.m.MessageToast.show("Hola, soy un mensaje de prueba!");
        },
      }
    );
  }
);
