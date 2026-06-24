import { userRouter } from "./user.routes";
import { userContracts } from "./user.contracts";
import type { AppModule } from "../../core/loader";

const userModule: AppModule = {
  name: "users",
  router: userRouter,
  contracts: userContracts,
};

export default userModule;
