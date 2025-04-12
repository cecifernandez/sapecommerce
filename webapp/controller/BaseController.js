sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (
    Controller,
    Fragment,
    JSONModel,
    MessageToast,
    Filter,
    FilterOperator
  ) {
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

        getResourceBundle() {
          return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        navTo(sRoute) {
          this.getRouter().navTo(sRoute);
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

        onNavToProducts() {
          this.navTo("productsList");
          this.setModel(new JSONModel({ subcategories: [] }), "subcategories");
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
                MessageToast.show(
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
            "ui5.starwarsecommerce.fragments.Cart",
            "CartPopover"
          ).then((oPopover) => {
            if (oPopover) {
              oPopover.openBy(oEvent.getSource());
            }
          });
        },

        getCartTotal() {
          let oModel = this.getProductModel();
          let aCart = oModel.getProperty("/cart") || [];

          let fTotal = aCart.reduce((sum, item) => {
            return sum + item.price * item.quantity;
          }, 0);

          oModel.setProperty("/cartTotal", fTotal.toFixed(2));
        },

        addToCart(oProduct) {
          let oModel = this.getProductModel();
          let aCart = oModel.getProperty("/cart");

          let oCartItem = aCart.find((item) => item.id === oProduct.id);
          let aUpdatedCart;

          if (oCartItem) {
            aUpdatedCart = aCart.map((item) => {
              return item.id === oProduct.id
                ? { ...item, quantity: item.quantity + 1 }
                : item;
            });
          } else {
            let oNewItem = { ...oProduct, quantity: 1 };
            aUpdatedCart = [...aCart, oNewItem];
          }

          oModel.setProperty("/cart", aUpdatedCart);
          this.showMessage(`${oProduct.name} agregado al carrito 🛒`);

          console.log("Carrito actualizado:", aUpdatedCart);
        },

        removeFromCart(sProductId) {
          let oModel = this.getProductModel();
          let aCart = oModel.getProperty("/cart") || [];

          let aUpdatedCart = aCart.filter((item) => item.id !== sProductId);

          oModel.setProperty("/cart", aUpdatedCart);
          this.showMessage("Producto eliminado del carrito 🗑️");
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

        onAfterRendering() {
          let oButton = this.byId("productsText");
          if (oButton && !this._bHoverAttached) {
            this._bHoverAttached = true;
            let $btn = oButton.$();
            $btn.on("mouseenter", this._onProductsMouseEnter.bind(this));
            $btn.on("mouseleave", this._onMouseLeavePopover.bind(this));
          }
        },

        _showHoverPopover(options) {
          const {
            fragmentId,
            fragmentName,
            triggerControlId,
            storeProperty,
            controller = this,
          } = options;
          const promiseProperty = `${storeProperty}Promise`;

          if (!this[promiseProperty]) {
            this[promiseProperty] = this.loadFragment({
              id: fragmentId,
              name: fragmentName,
            })
              .then((oPopover) => {
                this[storeProperty] = oPopover;

                // Configurar eventos de hover
                oPopover.attachBrowserEvent(
                  "mouseenter",
                  () => (this._isHoveringPopover = true)
                );
                oPopover.attachBrowserEvent(
                  "mouseleave",
                  this._onMouseLeavePopover.bind(this)
                );

                // Abrir el popover
                oPopover.openBy(controller.byId(triggerControlId));
                return oPopover;
              })
              .catch((error) => {
                console.error("Error al cargar popover:", error);
                this[promiseProperty] = null;
                return null;
              });
          } else if (this[storeProperty]) {
            // Si ya está cargado, abrirlo directamente
            this[storeProperty].openBy(controller.byId(triggerControlId));
          } else {
            // Si está en proceso de carga, esperar a que termine
            this[promiseProperty].then((oPopover) => {
              if (oPopover) oPopover.openBy(controller.byId(triggerControlId));
            });
          }

          this._isHoveringPopover = false;
        },

        _onProductsMouseEnter() {
          this._showHoverPopover({
            fragmentId: this.getView().getId(),
            fragmentName: "ui5.starwarsecommerce.fragments.Categories",
            triggerControlId: "productsText",
            storeProperty: "_oCategoriesPopover",
          });
        },

        _onMouseLeavePopover() {
          setTimeout(() => {
            if (!this._isHoveringPopover) {
              this._oCategoriesPopover.close();
            }
          }, 300);
        },

        getProductContext(oEvent, sModelName = "products") {
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
          let oContext = this.getProductContext(oEvent, sModelName);
          return oContext ? oContext.getObject() : null;
        },

        setJSONModel(data, name) {
          let oModel = new JSONModel(data);
          this.setModel(oModel, name);
        },

        createPurchaseRecord(aItems, sTotal) {
          return {
            date: new Date().toISOString(),
            items: [...aItems],
            total: parseFloat(sTotal),
          };
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

        onSearch(oEvent) {
          const sQuery = oEvent.getSource().getValue().toLowerCase();

          const oView = this.getView();
          const oModel = oView.getUserModel();

          const oProductList = oView.byId("productList");
          if (oProductList) {
            const aProductFilter = sQuery
              ? [new Filter("name", FilterOperator.Contains, sQuery)]
              : [];
            oProductList.getBinding("items").filter(aProductFilter);
          }
        },

        markFavorites(aProducts) {
          const aFavorites =
            JSON.parse(localStorage.getItem("favorites")) || [];

          return aProducts.map((product) => {
            const isFav = aFavorites.some((fav) => fav.id === product.id);
            return { ...product, isFavorite: isFav };
          });
        },

        toggleFavorite(oProduct) {
          const sId = oProduct.id;

          // 🔄 Leer favoritos desde localStorage
          let aFavorites = JSON.parse(localStorage.getItem("favorites")) || [];

          const bAlreadyFav = aFavorites.some((fav) => fav.id === sId);

          if (!bAlreadyFav) {
            aFavorites.push(oProduct);
            oProduct.isFavorite = true;
            this.showMessage(`${oProduct.name} agregado a favoritos ❤️`);
          } else {
            aFavorites = aFavorites.filter((fav) => fav.id !== sId);
            oProduct.isFavorite = false;
            this.showMessage(`${oProduct.name} eliminado de favoritos 💔`);
          }

          // Guardar en localStorage
          localStorage.setItem("favorites", JSON.stringify(aFavorites));

          // Modelo destacados (home)
          const oDestacadosModel = this.getView()?.getModel("destacados");
          if (oDestacadosModel) {
            const aDestacados =
              oDestacadosModel.getProperty("/destacados") || [];
            const iDestIndex = aDestacados.findIndex((p) => p.id === sId);
            if (iDestIndex !== -1) {
              oDestacadosModel.setProperty(
                `/destacados/${iDestIndex}/isFavorite`,
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
      }
    );
  }
);
