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

          // Cargar productos generales
          this.waitForProductModel((oData) => {
            if (!oData || !oData.catalog) {
              console.warn("El catálogo de productos no está disponible.");
              return;
            }

            const aProducts = this.extractProducts(oData.catalog);
            this.setJSONModel({ products: aProducts }, "products");
          });
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

          const aCartItems = oProductModel.getProperty("/cart") || [];
          const sTotal = oProductModel.getProperty("/cartTotal") || "0.00";

          if (aCartItems.length === 0) {
            sap.m.MessageToast.show("Tu carrito está vacío 🛒");
            return;
          }

          const oNewPurchase = this.createPurchaseRecord(aCartItems, sTotal);
          const aHistory = oUserModel.getProperty("/purchaseHistory") || [];

          aHistory.push(oNewPurchase);
          oUserModel.setProperty("/purchaseHistory", aHistory);

          oProductModel.setProperty("/cart", []);
          oProductModel.setProperty("/cartTotal", "0.00");

          localStorage.setItem("purchaseHistory", JSON.stringify(aHistory));

          sap.m.MessageToast.show("¡Compra realizada con éxito! 🎉");
          this.navTo("account");
        },

        // ───── Productos y Filtros ───────────────────────────────────
        _onCategoryMatched(oEvent) {
          const sCategory = decodeURIComponent(
            oEvent.getParameter("arguments").category
          );
          this._selectedCategory = { name: sCategory };

          this.waitForProductModel((oData) => {
            const aCategoryProducts = this.extractProducts(
              oData.catalog,
              (p) => p.category.toLowerCase() === sCategory.toLowerCase()
            );

            this.setJSONModel({ products: aCategoryProducts }, "products");

            const aSubcategories = this.getSubcategoriesByCategoryName(
              oData.catalog,
              sCategory
            );
            this.setJSONModel(
              { subcategories: aSubcategories },
              "subcategories"
            );
          });
        },

        _onSubcategoryMatched(oEvent) {
          const sCategory = decodeURIComponent(
            oEvent.getParameter("arguments").category
          );
          const sSubcategory = decodeURIComponent(
            oEvent.getParameter("arguments").subcategory
          );

          this.waitForProductModel((oData) => {
            const aFiltered = this.extractProducts(
              oData.catalog,
              (product) =>
                product.category.toLowerCase() === sCategory.toLowerCase() &&
                product.subcategory &&
                product.subcategory.toLowerCase() === sSubcategory.toLowerCase()
            );

            this.setJSONModel({ products: aFiltered }, "products");

            const aSubcategories = this.getSubcategoriesByCategoryName(
              oData.catalog,
              sCategory
            );
            this.setJSONModel(
              { subcategories: aSubcategories },
              "subcategories"
            );
          });
        },

        _onAllProductsMatched() {
          this.waitForProductModel((oData) => {
            const aProducts = this.extractProducts(oData.catalog);
            this.setJSONModel({ products: aProducts }, "products");
          });
        },

        onProductPress(oEvent) {
          const oProduct = this.getObjectFromEvent(oEvent, "products");
          if (!oProduct) {
            console.error("No se encontró el producto desde el evento.");
            return;
          }

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
          const oUserModel = this.getUserModel();
          let aFavorites = oUserModel.getProperty("/favorites") || [];

          const bAlreadyFav = aFavorites.some((fav) => fav.id === oProduct.id);

          if (!bAlreadyFav) {
            aFavorites.push(oProduct);
            sap.m.MessageToast.show(`${oProduct.name} agregado a favoritos ❤️`);
          } else {
            aFavorites = aFavorites.filter((fav) => fav.id !== oProduct.id);
            sap.m.MessageToast.show(
              `${oProduct.name} eliminado de favoritos 💔`
            );
          }

          // 🧠 Actualizar modelo
          oUserModel.setProperty("/favorites", aFavorites);

          // 💾 Guardar en localStorage
          localStorage.setItem("favorites", JSON.stringify(aFavorites));
        },

        // ───── Helpers ───────────────────────────────────────────────

        onShowMessage() {
          sap.m.MessageToast.show("Hola, soy un mensaje de prueba!");
        },
      }
    );
  }
);
