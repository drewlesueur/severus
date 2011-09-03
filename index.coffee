$ ->
  tablePresenter = require "table-presenter"
  tablePresenter = tablePresenter.init
    type: "menu"
    fields: ["order", "image", "title", "price", "description"]

  $(document.body).append tablePresenter.getEl()

