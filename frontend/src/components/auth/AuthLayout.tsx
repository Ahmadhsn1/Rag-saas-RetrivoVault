import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const PROMISES = [
  ["Every answer is cited", "Open the passage, the page, and the original file."],
  ["It says when it doesn’t know", "No answers invented from outside your documents."],
  ["Private to your account", "Never shared, never used to train a model."],
];

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.9fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="w-fit rounded-md">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-3xl">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>

      <aside className="hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-center lg:px-16">
        <p className="max-w-md font-serif text-4xl leading-tight">
          Ask your documents. <em className="font-normal">Check the source.</em>
        </p>
        <dl className="mt-12 max-w-md divide-y divide-primary-foreground/15 border-y border-primary-foreground/15">
          {PROMISES.map(([k, v]) => (
            <div key={k} className="py-4">
              <dt className="font-medium">{k}</dt>
              <dd className="mt-0.5 text-sm text-primary-foreground/70">{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
