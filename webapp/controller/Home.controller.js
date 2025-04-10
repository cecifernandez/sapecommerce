sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("ui5.starwarsecommerce.controller.Home", {
      onInit() {
        let oModel = this.getModel("productModel");

        if (!oModel) {
          console.warn("El modelo 'productModel' aún no está disponible.");
          return;
        }

        // Esperar a que el modelo haya terminado de cargar
        oModel.attachRequestCompleted(() => {
          let oData = oModel.getData();

          if (!oData || !oData.catalog) {
            console.warn("No se encontró el catálogo en el modelo.");
            return;
          }

          let aDestacados = this.extractProducts(
            oData.catalog,
            (product) => product.rating >= 4.5
          );

          let oDestacadosModel = new JSONModel({
            destacados: aDestacados,
          });
          this.setModel(oDestacadosModel, "destacados");
        });
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
    });
  }
);
