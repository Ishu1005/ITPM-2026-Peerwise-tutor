/** Canonical module catalog — keep in sync with payment UI options */
const MODULE_CATALOG = {
  'MOD-IT1010': { name: 'IT1010 - Intro to IT', price: 3000 },
  'MOD-IT3010': { name: 'IT3010 - Deep Learning', price: 4500 },
  'MOD-IT2010': { name: 'IT2010 - Algorithms', price: 3500 },
};

function getModule(moduleId) {
  return MODULE_CATALOG[moduleId] || null;
}

function listModules() {
  return Object.entries(MODULE_CATALOG).map(([id, v]) => ({
    moduleId: id,
    name: v.name,
    price: v.price,
  }));
}

module.exports = { MODULE_CATALOG, getModule, listModules };
