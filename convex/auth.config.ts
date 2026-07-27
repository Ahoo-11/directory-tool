import { getConvexProvidersConfig } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID is missing from env");
}

const authConfig = {
  providers: getConvexProvidersConfig({
    projectId,
  }),
};

export default authConfig;
