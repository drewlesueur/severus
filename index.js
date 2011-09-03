(function() {
  $(function() {
    var tablePresenter;
    tablePresenter = require("table-presenter");
    tablePresenter = tablePresenter.init({
      type: "menu",
      fields: ["order", "image", "title", "price", "description"]
    });
    return $(document.body).append(tablePresenter.getEl());
  });
}).call(this);
