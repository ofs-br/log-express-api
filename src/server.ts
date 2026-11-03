import { app } from "./app";
import { env } from "./env";

const PORT = env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`App is running on port ${PORT}`);
});
