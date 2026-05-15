import routes from "./server/routes.js";
console.log("typeof routes:", typeof routes);
console.log("Is routes a function?", typeof routes === 'function');
console.log("Does routes have default?", !!routes.default);
if (typeof routes !== 'function') {
    console.log("ERROR: routes is not a valid middleware function!");
}
process.exit(0);
