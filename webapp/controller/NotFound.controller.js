sap.ui.define(["./BaseController"], function (BaseController) {
  "use strict";

  return BaseController.extend("ui5.starwarsecommerce.controller.NotFound", {
    onInit () {
      var oRouter, oTarget;

      oRouter = this.getRouter();
      oTarget = oRouter.getTarget("notFound");
      oTarget.attachDisplay(function (oEvent) {
        this._oData = oEvent.getParameter("data");
      }, this);
    },
    onNavBack () {
      if (this._oData && this._oData.fromTarget) {
        this.getRouter().getTargets().display(this._oData.fromTarget);
        delete this._oData.fromTarget;
        return;
      }
      BaseController.prototype.onNavBack.apply(this, arguments);
    },
  });
});
