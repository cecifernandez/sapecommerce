sap.ui.define(["./BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("ui5.starwarsecommerce.controller.ProductList", {
    onInit() {
      const oRouter = this.getRouter();
      oRouter
        .getRoute("productsByCategory")
        .attachPatternMatched(this._onCategoryMatched, this);
      oRouter
        .getRoute("productsList")
        .attachPatternMatched(this._onAllProductsMatched, this);
      oRouter
        .getRoute("productsBySubcategory")
        .attachPatternMatched(this._onSubcategoryMatched, this);
    },

    // ───── Navegación ─────────────────────────────────────────────
    onNavToHome() {
      this.navTo("home");
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
      this.toggleFavorite(oProduct, "products");

      this.getModel("products").setProperty("/isFavorite", oProduct.isFavorite);
    },

    // ───── Filtros ───────────────────────────────────────────────

    onSort() {
      this._loadFragment(
        "ui5.starwarsecommerce.view.fragments.SortDialog",
        "SortDialog"
      ).then((oDialog) => {
        if (oDialog) {
          oDialog.open();
        }
      });
    },

    onCancelFilters() {
      const oModel = this.getView().getModel("products");
      oModel.setProperty("/filterByPrice", false);
      oModel.setProperty("/filterByRating", false);
      oModel.setProperty("/priceSortOrder", "");
      oModel.setProperty("/ratingSortOrder", "");

      if (this._oSortDialog && this._oSortDialog.isOpen()) {
        this._oSortDialog.close();
      }

      if (this._oSortDialog) {
        this._oSortDialog.destroy();
        this._oSortDialog = null;
      }

      this._pSortDialog = null;
    },

    onPriceSelect(oEvent) {
      const bSelected = oEvent.getParameter("selected");
      const oModel = this.getView().getModel("products");

      oModel.setProperty("/filterByPrice", bSelected);
      if (bSelected) {
        oModel.setProperty("/filterByRating", false);
      }
    },

    onRatingSelect(oEvent) {
      const bSelected = oEvent.getParameter("selected");
      const oModel = this.getView().getModel("products");

      oModel.setProperty("/filterByRating", bSelected);
      if (bSelected) {
        oModel.setProperty("/filterByPrice", false);
      }
    },

    onApplyFilters() {
      const oProductsModel = this.getView().getModel("products");
      let aProducts = oProductsModel.getProperty("/products");

      const bPrice = oProductsModel.getProperty("/filterByPrice");
      const bRating = oProductsModel.getProperty("/filterByRating");
      const priceOrder = oProductsModel.getProperty("/priceSortOrder");
      const ratingOrder = oProductsModel.getProperty("/ratingSortOrder");

      if (bPrice && priceOrder) {
        aProducts = this._filterByPrice(aProducts, priceOrder);
      }

      if (bRating && ratingOrder) {
        aProducts = this._filterByRating(aProducts, ratingOrder);
      }

      oProductsModel.setProperty("/products", aProducts);
      this._oSortDialog.close();
      this.showMessage("Filtros aplicados con éxito");
    },

    _filterByPrice(aProducts, priceOrder) {
      return aProducts.sort((a, b) => {
        return priceOrder === "asc" ? a.price - b.price : b.price - a.price;
      });
    },

    _filterByRating(aProducts, ratingOrder) {
      return aProducts.sort((a, b) => {
        return ratingOrder === "asc"
          ? a.rating - b.rating
          : b.rating - a.rating;
      });
    },

    onResetFilters() {
      const oModel = this.getView().getModel("products");

      oModel.setProperty("/filterByPrice", false);
      oModel.setProperty("/filterByRating", false);
      oModel.setProperty("/priceSortOrder", "");
      oModel.setProperty("/ratingSortOrder", "");

      const oProductModel = this.getProductModel();
      const aProducts = this.extractProducts(oProductModel.getData().catalog);
      const aMarkedProducts = this.markFavorites(aProducts);
      oModel.setProperty("/products", aMarkedProducts);

      this.showMessage("Filtros reiniciados");
    },

    onSearch(oEvent) {
      const sQuery = oEvent.getSource().getValue().toLowerCase();

      const oView = this.getView();
      const oProductList = oView.byId("productList");
      const aProductFilter = sQuery
        ? [
            new sap.ui.model.Filter(
              "name",
              sap.ui.model.FilterOperator.Contains,
              sQuery
            ),
          ]
        : [];
      oProductList.getBinding("items").filter(aProductFilter, "Application");
    },
  });
});
