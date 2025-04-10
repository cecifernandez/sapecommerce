sap.ui.define(
  ["./BaseController", "sap/ui/model/resource/ResourceModel"],
  function (BaseController, ResourceModel) {
    "use strict";

    return BaseController.extend("ui5.starwarsecommerce.controller.App", {
      onInit() {
        const i18nModel = new ResourceModel({
          bundleName: "ui5.starwarsecommerce.i18n.en.i18n",
        });
        this.setModel(i18nModel, "i18n");
      },

      
    });
  }
);

//ctrl + shift + alt + s debugging tools
