import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { validate } from "./validate";
import { Form, Link, useActionData } from "@remix-run/react";
import { login } from "./queries";
import { authCookie } from "~/auth";

export const meta = () => {
  return [{ title: "PlaGeA Login" }];
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const errors = validate(email, password);
  if (errors) {
    return json({ ok: false, errors }, 400);
  }

  const userId = await login(email, password);
  if (!userId) {
    return json(
      { ok: false, errors: { email: null, password: "Invalid credentials" } },
      400,
    );
  }

  return redirect("/", {
    headers: {
      "Set-Cookie": await authCookie.serialize(userId),
    }
  });
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const emailError = actionData?.errors?.email;
  const passwordError = actionData?.errors?.password;

  return (
    <div className="flex min-h-full flex-1 flex-col mt-20 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2
          id="login-header"
          className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900"
        >
          Iniciar sessão
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          <Form className="space-y-6" method="post">
            <div>
              <label 
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Endereço de email{" "}
                {emailError && (
                  <span className="text-brand-red">
                    {emailError}
                  </span>
                )}
              </label>
              <input 
                autoFocus
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required  
                aria-describedby={
                  actionData?.errors?.email ? "email-error" : "login-header"
                }
                className="form-input block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
              />
            </div>

            <div>
              <label 
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Senha{" "}
                {passwordError && (
                  <span className="text-brand-red">
                    {passwordError}
                  </span>
                )}
              </label>
              <input 
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-describedby="password-error"
                required
                className="form-input block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
              />
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-brand-blue px-1 py-1 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              Inciar sessão
            </button>

            <div className="text-sm text-slate-500">
              Don't have an account?{" "}
              <Link className="underline" to="/signup">
                Sign up
              </Link>
              .
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}