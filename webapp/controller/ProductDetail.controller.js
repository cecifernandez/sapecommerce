sap.ui.define(
  ["./BaseController", "sap/ui/model/json/JSONModel"],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend(
      "ui5.starwarsecommerce.controller.ProductDetail",
      {
        onInit() {
          const oRouter = this.getRouter();
          oRouter
            .getRoute("productDetail")
            .attachPatternMatched(this._onObjectMatched, this);

          const oUserModel = this.getUserModel();
          try {
            const storedFavorites =
              JSON.parse(localStorage.getItem("favorites")) || [];
            const storedReviews =
              JSON.parse(localStorage.getItem("reviews")) || [];
            const storedPurchases =
              JSON.parse(localStorage.getItem("purchaseHistory")) || [];

            oUserModel.setProperty("/favorites", storedFavorites);
            oUserModel.setProperty("/reviews", storedReviews);
            oUserModel.setProperty("/purchaseHistory", storedPurchases);
          } catch (e) {
            console.warn("Error leyendo datos del localStorage:", e);
          }
        },

        _onObjectMatched(oEvent) {
          const sProductId = oEvent.getParameter("arguments").productId;
          const oProductModel = this.getProductModel();

          this._currentProductId = sProductId;

          if (!oProductModel) {
            showMessage("Modelo de productos no disponible ❌");
            return;
          }

          const aProducts = this.extractProducts(
            oProductModel.getData().catalog
          );
          const oProduct = aProducts.find((p) => p.id === sProductId);

          if (!oProduct) {
            showMessage("Producto no encontrado ❌");
            this.getRouter().navTo("notFound", {
              fromTarget: "productDetail",
            });
            return;
          }

          if (oProduct.variants && oProduct.variants.length > 0) {
            oProduct.selectedVariant = oProduct.variants[0].name;
            oProduct.images = oProduct.variants[0].images;
          }

          oProduct.isFavorite = this.isProductFavorite(oProduct);

          const oDetailModel = new JSONModel(oProduct);
          this.getView().setModel(oDetailModel, "productDetail");

          const oUserModel = this.getUserModel();
          this._filterUserReviews(
            sProductId,
            oUserModel.getProperty("/username")
          );
        },

        onAddToCart() {
          const oProduct = this.getModel("productDetail").getProperty("/");
          if (!oProduct || !oProduct.id) {
            showMessage("❌ Producto no disponible.");
            return;
          }

          this.addToCart(oProduct);
          this.getCartTotal();
          showMessage(`${oProduct.name} agregado al carrito 🛒`);
        },

        onRemoveFromCart(oEvent) {
          const oProduct = this.getObjectFromEvent(oEvent, "productModel");
          this.removeFromCart(oProduct.id);
          this.getCartTotal();
        },

        onPostReview() {
          const oView = this.getView();
          const oUserModel = this.getUserModel();
          const oProduct = oView.getModel("productDetail").getData();
          const oViewModel = oView.getModel("viewModel");

          const sText = oViewModel.getProperty("/reviewText").toLowerCase();
          const iRating = oViewModel.getProperty("/reviewRating");

          if (!sText) {
            showMessage("Por favor escribí una reseña antes de enviar.");
            return;
          }

          if (iRating === 0) {
            showMessage("Por favor seleccioná una calificación.");
            return;
          }

          const aReviews = oUserModel.getProperty("/reviews") || [];
          aReviews.push({
            productId: oProduct.id,
            text: sText,
            user: oUserModel.getProperty("/username"),
            rating: iRating,
            date: new Date().toISOString(),
          });

          oUserModel.setProperty("/reviews", aReviews);
          localStorage.setItem("reviews", JSON.stringify(aReviews));

          oViewModel.setProperty("/reviewText", "");
          oViewModel.setProperty("/reviewRating", 0);

          showMessage("¡Gracias por tu reseña!");

          const storedReviews =
            JSON.parse(localStorage.getItem("reviews")) || [];
          oUserModel.setProperty("/reviews", storedReviews);

          this._filterUserReviews(
            oProduct.id,
            oUserModel.getProperty("/username")
          );
        },

        _filterUserReviews(productId, username) {
          const oUserModel = this.getUserModel();
          const aAllReviews = oUserModel.getProperty("/reviews") || [];

          const aUserReviews = aAllReviews.filter(
            (r) => r.productId === productId && r.user === username
          );

          oUserModel.setProperty("/filteredUserReviews", aUserReviews);
        },

        onToggleFavorite() {
          const oProduct = this.getModel("productDetail").getProperty("/");
          this.toggleFavorite(oProduct);

          this.getModel("productDetail").setProperty(
            "/isFavorite",
            oProduct.isFavorite
          );
        },

        onVariantChange(oEvent) {
          const sSelectedVariant = oEvent.getParameter("selectedItem").getKey();
          const oModel = this.getView().getModel("productDetail");
          const aVariants = oModel.getProperty("/variants");

          const oVariant = aVariants.find((v) => v.name === sSelectedVariant);
          if (oVariant) {
            oModel.setProperty("/images", oVariant.images);
            oModel.setProperty("/selectedVariant", sSelectedVariant);
          }
        },
      }
    );
  }
);
