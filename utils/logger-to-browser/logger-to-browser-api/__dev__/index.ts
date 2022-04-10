import dl from "../dist/index.js";

dl.name = "Test debugger";
dl.attach("http://localhost:3000/");
console.log("Attached!");

dl.log("abc", { abc: 123 });

setTimeout(() => dl.detach(), 3000);
