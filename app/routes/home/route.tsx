import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireAuthCookie } from "~/auth";

export const meta = () => {
  return [{ title: "PlaGeA | Home" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAuthCookie(request);
  // const boards = await getHomeData(userId);
  // return { boards };
  return { ok: true };
}

export default function Home() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div>
      <h2>Home</h2>
    </div>
  );
}