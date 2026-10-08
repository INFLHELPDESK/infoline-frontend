"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import PostCard from "./card";
import type { BlogPost } from "@/lib/blog";

/**
 * "All updates" — headline + count chips (Articles (+30), Events (4)…) that
 * filter the grid client-side. Chip counts come from the posts themselves.
 */
export default function Updates({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations("Blog.page");
  const filters = t.raw("filters") as { id: string; label: string }[];

  const [active, setActive] = useState("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of filters) map[f.id] = 0;
    for (const p of posts) {
      const f = filters.find((x) => x.label === p.category);
      if (f) map[f.id] = (map[f.id] ?? 0) + 1;
    }
    return map;
  }, [filters, posts]);

  const visible =
    active === "all"
      ? posts
      : posts.filter(
          (p) => filters.find((f) => f.id === active)?.label === p.category,
        );

  return (
    <section className="bg-white pb-24 lg:pb-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="mb-9 flex flex-wrap items-center justify-between gap-4"
          stagger={0.1}
          amount={0.4}
        >
          <StaggerItem>
            <h2 className="text-[32px] font-bold tracking-[-.02em] text-ink">
              {t("allUpdatesLabel")}
            </h2>
          </StaggerItem>
          <StaggerItem className="flex flex-wrap items-center gap-2.5">
            {filters.map((f) => {
              const isActive = active === f.id;
              const count = counts[f.id] ?? 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(f.id)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4.5 py-2.5 text-[13px] font-semibold transition-colors duration-300 ${
                    isActive
                      ? "bg-brandblue-500 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                  {count > 0 ? ` (+${count})` : ""}
                </button>
              );
            })}
          </StaggerItem>
        </Stagger>

        <Stagger
          key={active}
          as="div"
          className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.09}
          amount={0.15}
        >
          {visible.map((post) => (
            <StaggerItem as="div" key={post.slug}>
              <PostCard post={post} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
