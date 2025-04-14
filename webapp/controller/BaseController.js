sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
  ],
  function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend(
      "ui5.starwarsecommerce.controller.BaseController",
      {
        getRouter() {
          return this.getOwnerComponent().getRouter();
        },

        getModel: function (sName) {
          return this.getView()
            ? this.getView().getModel(sName)
            : this.getOwnerComponent().getModel(sName);
        },

        setModel(oModel, sName) {
          this.getView().setModel(oModel, sName);
        },

        navTo(sRoute) {
          this.getRouter().navTo(sRoute);
        },

        onNavToProducts(oEvent) {
          this._loadFragment(
            "ui5.starwarsecommerce.view.fragments.Categories",
            "CategoriesPopover"
          ).then((oPopover) => {
            if (!this._oCategoriesPopover) {
              this._oCategoriesPopover = oPopover;
            }

            this._oCategoriesPopover.openBy(oEvent.getSource());
          });
          this.navTo("productsList");
          this.setJSONModel({ subcategories: [] }, "subcategories");
        },

        onNavBack() {
          const oHistory = sap.ui.core.routing.History.getInstance();
          const sPreviousHash = oHistory.getPreviousHash();

          if (sPreviousHash !== undefined) {
            window.history.go(-1);
          } else {
            this.navTo("home", {}, true);
          }
        },

        onNavForward() {
          window.history.forward();
        },

        extractProducts(catalog, fnCondition) {
          let aProducts = [];
          catalog.categories.forEach((category) => {
            category.subcategories.forEach((subcategory) => {
              subcategory.products.forEach((product) => {
                let oProduct = { ...product };
                oProduct.subcategory = subcategory.name;
                oProduct.category = category.name;

                if (!fnCondition || fnCondition(oProduct)) {
                  aProducts.push(oProduct);
                }
              });
            });
          });
          return aProducts;
        },

        onNavToHome() {
          this.navTo("home");
        },

        onNavToAccount() {
          this.navTo("account");
        },

        _loadFragment: function (sFragmentName, sFragmentType) {
          const sPromiseVar = "_p" + sFragmentType;
          const sObjectVar = "_o" + sFragmentType;

          if (!this[sPromiseVar]) {
            this[sPromiseVar] = this.loadFragment({
              id: this.getView().getId(),
              name: sFragmentName,
              controller: this,
            })
              .then((oFragment) => {
                this[sObjectVar] = oFragment;
                return oFragment;
              })
              .catch((oError) => {
                showMessage(
                  "Error al cargar " + sFragmentType + ": " + oError.message
                );
                this[sPromiseVar] = null;
                return null;
              });
          }

          return this[sPromiseVar];
        },

        openCart(oEvent) {
          this._loadFragment(
            "ui5.starwarsecommerce.view.fragments.Cart",
            "CartPopover"
          ).then((oPopover) => {
            if (oPopover) {
              this._oCartPopover = oPopover;
              oPopover.openBy(oEvent.getSource());
            }
          });
        },

        addToCart(oProduct) {
          if (!oProduct) {
            this.showMessage("No se pudo agregar el producto al carrito.");
            return;
          }

          const oModel = this.getProductModel();
          const aCart = oModel.getProperty("/cart") || [];

          const oCartItem = aCart.find((item) => item.id === oProduct.id);
          if (oCartItem) {
            oCartItem.quantity += 1;
          } else {
            aCart.push({ ...oProduct, quantity: 1 });
          }

          oModel.setProperty("/cart", aCart);
          oModel.refresh();
          this.showMessage(`${oProduct.name} agregado al carrito 🛒`);
        },

        removeFromCart(sProductId) {
          const oModel = this.getProductModel();
          const aCart = oModel.getProperty("/cart") || [];

          const aUpdatedCart = aCart.filter((item) => item.id !== sProductId);

          oModel.setProperty("/cart", aUpdatedCart);
          oModel.refresh();
          this.showMessage("Producto eliminado del carrito 🗑️");
        },

        getCartTotal() {
          const oModel = this.getProductModel();
          const aCart = oModel.getProperty("/cart") || [];

          const fTotal = aCart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
          oModel.setProperty("/cartTotal", fTotal.toFixed(2));
          return fTotal;
        },

        updateCartQuantity(oEvent) {
          const oButton = oEvent.getSource();

          const oContext = oButton.getBindingContext("productModel");

          const iCurrentQuantity = oContext.getProperty("quantity");

          const bIncrement = oButton.getIcon() === "sap-icon://add";
          const iNewQuantity = bIncrement
            ? iCurrentQuantity + 1
            : Math.max(iCurrentQuantity - 1, 1);
          oContext.setProperty("quantity", iNewQuantity);

          this.getCartTotal();
        },

        getSubcategoriesByCategoryName(catalog, categoryName) {
          if (!catalog?.categories) return [];

          let oCategory = catalog.categories.find(
            (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
          );
          return oCategory ? oCategory.subcategories : [];
        },

        onCategorySelect(oEvent) {
          let sCategory = oEvent.getSource().getTitle();
          this.getRouter().navTo("productsByCategory", {
            category: encodeURIComponent(sCategory),
          });
        },

        _getProductContext(oEvent, sModelName = "products") {
          let oContext = oEvent.getSource().getBindingContext(sModelName);

          if (!oContext && typeof oEvent.getParameter === "function") {
            let oListItem = oEvent.getParameter("listItem");
            if (oListItem) {
              oContext = oListItem.getBindingContext(sModelName);
            }
          }
          if (!oContext) {
            let oParent = oEvent.getSource().getParent();
            while (oParent && !oContext) {
              oContext = oParent.getBindingContext(sModelName);
              oParent = oParent.getParent();
            }
          }
          return oContext;
        },

        getObjectFromEvent(oEvent, sModelName = "products") {
          let oContext = this._getProductContext(oEvent, sModelName);
          return oContext ? oContext.getObject() : null;
        },

        setJSONModel(data, name) {
          let oModel = new JSONModel(data);
          this.setModel(oModel, name);
        },

        getProductModel() {
          return this.getOwnerComponent().getModel("productModel");
        },

        getUserModel() {
          return this.getOwnerComponent().getModel("userModel");
        },

        showMessage(sText) {
          MessageToast.show(sText);
        },

        markFavorites(aProducts) {
          const aFavorites =
            JSON.parse(localStorage.getItem("favorites")) || [];

          return aProducts.map((product) => {
            const isFav = aFavorites.some((fav) => fav.id === product.id);
            return { ...product, isFavorite: isFav };
          });
        },

        isProductFavorite(oProduct) {
          if (!oProduct || !oProduct.id) {
            return false;
          }

          const aFavorites =
            JSON.parse(localStorage.getItem("favorites")) || [];
          return aFavorites.some((fav) => fav.id === oProduct.id);
        },

        toggleFavorite(oProduct, sModelName = "destacados") {
          if (!oProduct) {
            this.showMessage("No se pudo actualizar el estado de favoritos.");
            return;
          }

          const sId = oProduct.id;
          let aFavorites = JSON.parse(localStorage.getItem("favorites")) || [];
          const bAlreadyFav = aFavorites.some((fav) => fav.id === sId);

          if (bAlreadyFav) {
            aFavorites = aFavorites.filter((fav) => fav.id !== sId);
            oProduct.isFavorite = false;
            this.showMessage(`${oProduct.name} eliminado de favoritos 💔`);
          } else {
            aFavorites.push(oProduct);
            oProduct.isFavorite = true;
            this.showMessage(`${oProduct.name} agregado a favoritos ❤️`);
          }

          localStorage.setItem("favorites", JSON.stringify(aFavorites));

          const oModel = this.getView().getModel(sModelName);
          if (oModel) {
            const aItems = oModel.getProperty(`/${sModelName}`) || [];
            const iIndex = aItems.findIndex((p) => p.id === sId);
            if (iIndex !== -1) {
              oModel.setProperty(
                `/${sModelName}/${iIndex}/isFavorite`,
                oProduct.isFavorite
              );
            }
          }
        },

        _getCartItems(oProductModel) {
          return oProductModel.getProperty("/cart") || [];
        },

        _getCartTotal(oProductModel) {
          return oProductModel.getProperty("/cartTotal") || "0.00";
        },

        _hasItems(aItems) {
          return aItems.length > 0;
        },

        _createPurchase(aItems, total) {
          return {
            items: aItems,
            total: total,
            date: new Date().toLocaleString(),
          };
        },

        _savePurchase(oUserModel, oPurchase) {
          const aHistory = oUserModel.getProperty("/purchaseHistory") || [];
          aHistory.push(oPurchase);
          oUserModel.setProperty("/purchaseHistory", aHistory);
          localStorage.setItem("purchaseHistory", JSON.stringify(aHistory));
        },

        _clearCart(oProductModel) {
          oProductModel.setProperty("/cart", []);
          oProductModel.setProperty("/cartTotal", "0.00");
        },

        onCancelPurchase() {
          const oProductModel = this.getProductModel();
          this._clearCart(oProductModel);

          this._oCartPopover.close();
        },

        onCheckout() {
          this._loadFragment(
            "ui5.starwarsecommerce.view.fragments.CheckoutDialog",
            "CheckoutDialog"
          ).then((oDialog) => {
            if (!this._oCheckoutDialog) {
              this._oCheckoutDialog = oDialog;
              this.getView().addDependent(this._oCheckoutDialog);
            }
            const oCheckoutModel = new sap.ui.model.json.JSONModel({
              name: "",
              email: "",
              address: "",
              card: "",
              dni: "",
            });
            this._oCheckoutDialog.setModel(oCheckoutModel, "checkoutModel");
            this._oCheckoutDialog.open();
          });
        },

        onConfirmCheckout() {
          const oCheckoutModel =
            this._oCheckoutDialog.getModel("checkoutModel");
          const oData = oCheckoutModel.getData();

          if (!oData.name || !oData.email || !oData.address || !oData.card) {
            showMessage("Por favor, completa todos los campos.");
            return;
          }

          const oProductModel = this.getProductModel();
          const oUserModel = this.getUserModel();

          const aCartItems = this._getCartItems(oProductModel);
          const sTotal = this._getCartTotal(oProductModel);

          const oPurchase = this._createPurchase(aCartItems, sTotal);
          this._savePurchase(oUserModel, oPurchase);
          this._clearCart(oProductModel);

          showMessage("Compra realizada con éxito.");
          this._oCheckoutDialog.close();
        },

        onCancelCheckout() {
          this._oCheckoutDialog.close();
        },
      }
    );
  }
);
