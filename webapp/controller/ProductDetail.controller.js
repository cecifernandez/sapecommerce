sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageToast"],
  function (BaseController, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend(
      "ui5.starwarsecommerce.controller.ProductDetail",
      {
        onInit() {
          let oRouter = this.getOwnerComponent().getRouter();
          oRouter
            .getRoute("productDetail")
            .attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched(oEvent) {
          let sProductId = oEvent.getParameter("arguments").productId;
          let oProductModel = this.getModel("productModel");

          if (!oProductModel) {
            MessageToast.show("Modelo de productos no disponible ❌");
            return;
          }

          // Buscar producto por ID dentro de productModel
          let aProducts = this.extractProducts(oProductModel.getData().catalog);
          let oProduct = aProducts.find((p) => p.id === sProductId);

          if (!oProduct) {
            MessageToast.show("Producto no encontrado ❌");
            return;
          }

          // Setear un nuevo modelo con el producto seleccionado
          let oDetailModel = new JSONModel(oProduct);
          this.getView().setModel(oDetailModel, "productDetail");

          // Bindear la vista
          this.getView().bindElement({
            path: "/",
            model: "productDetail",
          });
        },

        onAddToCart() {
          let oProduct = this.getView()
            .getBindingContext("productDetail")
            .getObject();

          this.addToCart(oProduct);
          this.getCartTotal();

          MessageToast.show(oProduct.name + " agregado al carrito 🛒");
        },

        onRemoveFromCart(oEvent) {
          let oProduct = this.getObjectFromEvent(oEvent, "productModel");
          this.removeFromCart(oProduct.id);
          this.getCartTotal();
          console.log(oProduct);
        },

        onNavBack() {
          let oHistory = sap.ui.core.routing.History.getInstance();
          let sPreviousHash = oHistory.getPreviousHash();

          if (sPreviousHash !== undefined) {
            window.history.go(-1);
          } else {
            let oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("productList", {}, true);
          }
        },
      }
    );
  }
);
