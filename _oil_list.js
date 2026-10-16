var fs = require("fs");
var data = JSON.parse(fs.readFileSync("data/trade-products.json", "utf8"));
Object.keys(data.items).forEach(function (id) {
  var row = data.items[id];
  if (row.name !== "精油-10ml") return;
  console.log(id + "\t" + row.sku + "\t" + row.barcode + "\t" + row.price);
});
