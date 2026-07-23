import { scanDaily } from "./scan.js";

scanDaily()
  .then((stats) => {
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
