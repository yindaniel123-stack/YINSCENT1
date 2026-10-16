const lib = require("google-libphonenumber");

const phoneUtil = lib.PhoneNumberUtil.getInstance();
const PNF = lib.PhoneNumberFormat;

function toE164(raw, region) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const regionCode = String(region || "").trim().toUpperCase();
  const hinted = /^[A-Z]{2}$/.test(regionCode) ? regionCode : "";
  try {
    const number = phoneUtil.parse(text, text.startsWith("+") ? hinted || "ZZ" : hinted || "CN");
    if (!phoneUtil.isValidNumber(number)) return null;
    const detected = phoneUtil.getRegionCodeForNumber(number) || "";
    if (hinted && !text.startsWith("+") && detected && detected !== hinted) return null;
    return {
      e164: phoneUtil.format(number, PNF.E164),
      region: detected || hinted || "",
      countryCode: number.getCountryCode(),
    };
  } catch (e) {
    return null;
  }
}

function laneFor(e164) {
  return String(e164 || "").startsWith("+86") ? "cn" : "intl";
}

module.exports = { toE164, laneFor };
