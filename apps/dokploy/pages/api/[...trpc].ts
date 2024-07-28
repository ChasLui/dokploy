import { appRouter } from "@dokploy/server/api/root";
import { createTRPCContext } from "@dokploy/server/api/trpc";
import { validateRequest } from "@dokploy/server/auth/auth";
import { validateBearerToken } from "@dokploy/server/auth/token";
import { createOpenApiNextHandler } from "@dokploy/trpc-openapi";
import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	let { session, user } = await validateBearerToken(req);

	if (!session) {
		const cookieResult = await validateRequest(req, res);
		session = cookieResult.session;
		user = cookieResult.user;
	}

	if (!user || !session) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}
	// @ts-ignore
	return createOpenApiNextHandler({
		router: appRouter,
		createContext: createTRPCContext,
	})(req, res);
};

export default handler;
