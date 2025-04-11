sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"],
  function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("ui5.starwarsecommerce.Component", {
      metadata: {
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
        manifest: "json",
      },

      init() {
        UIComponent.prototype.init.apply(this, arguments);

        const oProductModel = this.getModel("productModel");

        oProductModel.attachRequestCompleted(() => {
          const data = oProductModel.getData();

          const destacados = [];
          const allProducts = [];

          data.catalog.categories.forEach((category) => {
            category.subcategories.forEach((subcategory) => {
              subcategory.products.forEach((product) => {
                allProducts.push(product);
                if (product.rating >= 4.5) {
                  destacados.push(product);
                }
              });
            });
          });

          const oViewModel = new JSONModel({
            reviewText: "",
          });
          this.setModel(oViewModel, "viewModel");
          // Modelos planos
          const oDestacadosModel = new JSONModel({ destacados });
          this.setModel(oDestacadosModel, "destacados");

          const oAllProductsModel = new JSONModel({ products: allProducts });
          this.setModel(oAllProductsModel, "products");
        });

        this.getRouter().initialize();
      },
    });
  }
);
