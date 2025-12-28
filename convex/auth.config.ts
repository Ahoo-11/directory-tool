import { getConvexProvidersConfig } from "@stackframe/stack";

const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID is missing from env");
}

export default {
  providers: getConvexProvidersConfig({
    projectId,
  }),
};
