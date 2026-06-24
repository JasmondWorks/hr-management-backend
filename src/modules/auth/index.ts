import { authRouter } from "./auth.routes";
import { authContracts } from "./auth.contracts";
import type { AppModule } from "../../core/loader";

const authModule: AppModule = {
  name: "auth",
  router: authRouter,
  contracts: authContracts,
};

export default authModule;
