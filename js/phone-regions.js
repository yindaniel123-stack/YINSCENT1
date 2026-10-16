(function () {
  var REGIONS = [
    ["CN", "86", "中国大陆", "China"],
    ["HK", "852", "中国香港", "Hong Kong"],
    ["MO", "853", "中国澳门", "Macao"],
    ["TW", "886", "中国台湾", "Taiwan"],
    ["US", "1", "美国", "United States"],
    ["CA", "1", "加拿大", "Canada"],
    ["GB", "44", "英国", "United Kingdom"],
    ["AU", "61", "澳大利亚", "Australia"],
    ["NZ", "64", "新西兰", "New Zealand"],
    ["JP", "81", "日本", "Japan"],
    ["KR", "82", "韩国", "Korea"],
    ["SG", "65", "新加坡", "Singapore"],
    ["MY", "60", "马来西亚", "Malaysia"],
    ["TH", "66", "泰国", "Thailand"],
    ["VN", "84", "越南", "Vietnam"],
    ["ID", "62", "印度尼西亚", "Indonesia"],
    ["PH", "63", "菲律宾", "Philippines"],
    ["IN", "91", "印度", "India"],
    ["AE", "971", "阿联酋", "United Arab Emirates"],
    ["SA", "966", "沙特阿拉伯", "Saudi Arabia"],
    ["DE", "49", "德国", "Germany"],
    ["FR", "33", "法国", "France"],
    ["IT", "39", "意大利", "Italy"],
    ["ES", "34", "西班牙", "Spain"],
    ["PT", "351", "葡萄牙", "Portugal"],
    ["NL", "31", "荷兰", "Netherlands"],
    ["BE", "32", "比利时", "Belgium"],
    ["CH", "41", "瑞士", "Switzerland"],
    ["SE", "46", "瑞典", "Sweden"],
    ["NO", "47", "挪威", "Norway"],
    ["DK", "45", "丹麦", "Denmark"],
    ["FI", "358", "芬兰", "Finland"],
    ["IE", "353", "爱尔兰", "Ireland"],
    ["RU", "7", "俄罗斯", "Russia"],
    ["BR", "55", "巴西", "Brazil"],
    ["MX", "52", "墨西哥", "Mexico"],
    ["AR", "54", "阿根廷", "Argentina"],
    ["ZA", "27", "南非", "South Africa"],
    ["TR", "90", "土耳其", "Turkey"],
    ["EG", "20", "埃及", "Egypt"]
  ];

  function lang() {
    var code = window.YINSCENT_I18N && window.YINSCENT_I18N.getLang ? window.YINSCENT_I18N.getLang() : "zh";
    return code === "zh" ? "zh" : "en";
  }

  function regions() {
    return REGIONS.map(function (row) {
      return { code: row[0], dial: row[1], zh: row[2], en: row[3] };
    });
  }

  function label(region) {
    var name = lang() === "zh" ? region.zh : region.en;
    return name + " +" + region.dial;
  }

  function fill(select) {
    if (!select) return;
    var current = select.value || "CN";
    select.innerHTML = "";
    regions().forEach(function (region) {
      var option = document.createElement("option");
      option.value = region.code;
      option.textContent = label(region);
      option.setAttribute("data-dial", region.dial);
      select.appendChild(option);
    });
    select.value = current;
    if (!select.value) select.value = "CN";
  }

  function dial(select) {
    var option = select && select.selectedOptions && select.selectedOptions[0];
    return option ? "+" + (option.getAttribute("data-dial") || "86") : "+86";
  }

  function deviceId() {
    var key = "yinscent-device";
    var id = "";
    try {
      id = localStorage.getItem(key) || "";
    } catch (e) {
      id = "";
    }
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = "d" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      id = id.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
      try {
        localStorage.setItem(key, id);
      } catch (e) {}
    }
    return id;
  }

  function payload(select, input) {
    return {
      region: (select && select.value) || "CN",
      nationalNumber: String((input && input.value) || "").trim(),
      deviceId: deviceId(),
    };
  }

  window.YinscentPhone = { fill: fill, dial: dial, deviceId: deviceId, payload: payload };
})();
