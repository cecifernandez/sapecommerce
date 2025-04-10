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

        waitForProductModel(callback) {
          const oModel = this.getModel("productModel");

          if (!oModel) {
            console.warn("Modelo productModel no disponible.");
            return;
          }

          if (oModel.getData() && oModel.getData().catalog) {
            callback(oModel.getData());
          } else {
            oModel.attachRequestCompleted(() => {
              callback(oModel.getData());
            });
          }
        },

        openCart(oEvent) {
          if (!this._pCartPopover) {
            this._pCartPopover = Fragment.load({
              id: this.getView().getId(),
              name: "ui5.starwarsecommerce.fragments.Cart",
              controller: this,
            }).then((oPopover) => {
              this.getView().addDependent(oPopover);
              return oPopover;
            });
          }
          this._pCartPopover.then((oPopover) => {
            oPopover.openBy(oEvent.getSource());
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
          let {
            fragmentId,
            fragmentName,
            triggerControlId,
            storeProperty,
            controller = this,
          } = options;

          if (!this[storeProperty]) {
            Fragment.load({
              id: fragmentId,
              name: fragmentName,
              controller,
            }).then((oPopover) => {
              this[storeProperty] = oPopover;
              controller.getView().addDependent(oPopover);
              oPopover.openBy(controller.byId(triggerControlId));

              let $popover = oPopover.$();
              $popover.on("mouseenter", () => {
                this._isHoveringPopover = true;
              });
              $popover.on("mouseleave", this._onMouseLeavePopover.bind(this));
            });
          } else {
            this[storeProperty].openBy(this.byId(triggerControlId));
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
          return this.getModel("productModel");
        },

        getUserModel() {
          return this.getModel("userModel");
        },

        showMessage(sText) {
          MessageToast.show(sText);
        },

        onSearch(oEvent) {
          const sQuery = oEvent.getSource().getValue().toLowerCase();

          const oView = this.getView();
          const oModel = oView.getModel("userModel");

          // En vista de productos
          const oProductList = oView.byId("productList");
          if (oProductList) {
            const aProductFilter = sQuery
              ? [new Filter("name", FilterOperator.Contains, sQuery)]
              : [];
            oProductList.getBinding("items").filter(aProductFilter);
          }

          //En favoritos
          const oFavoritesList = oView.byId("favoritesList");
          if (oFavoritesList) {
            const aFavFilter = sQuery
              ? [new Filter("name", FilterOperator.Contains, sQuery)]
              : [];
            oFavoritesList.getBinding("items").filter(aFavFilter);
          }

          // En compras
          const aOriginal = oModel.getProperty("/purchaseHistory");

          // Si no hay texto de búsqueda, mostrar todo
          if (!sQuery || sQuery.length === 0) {
            oModel.setProperty("/filteredPurchaseHistory", aOriginal);
          } else {
            // Filtrado por nombre del producto dentro de cada compra
            const aFiltered = aOriginal
              .map((purchase) => {
                const aFilteredItems = purchase.items.filter((item) =>
                  item.name.toLowerCase().includes(sQuery)
                );
                return { ...purchase, items: aFilteredItems };
              })
              .filter((p) => p.items.length > 0); // Solo mantener compras con al menos 1 ítem

            oModel.setProperty("/filteredPurchaseHistory", aFiltered);
          }
        },
      }
    );
  }
);
