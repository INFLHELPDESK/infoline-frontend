"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import PostCard from "./card";
import type { BlogPost } from "@/lib/blog";

/**
 * "All updates" — headline + filter chips (All, Articles, Events, News) that
 * filter the grid client-side by post category.
 */
export default function Updates({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations("Blog.page");
  const filters = t.raw("filters") as { id: string; label: string }[];

  const [active, setActive] = useState("all");

  const visible =
    active === "all"
      ? posts
      : posts.filter(
          (p) => filters.find((f) => f.id === active)?.label === p.category,
        );

  return (
    <section className="bg-white pt-20 pb-24 lg:pt-24 lg:pb-32">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Stagger
          as="div"
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
          stagger={0.1}
          amount={0.4}
        >
          <StaggerItem>
            <h2 className="text-[28px] leading-9 font-semibold text-slate-900 lg:text-[32px] lg:leading-10">
              {t("allUpdatesLabel")}
            </h2>
          </StaggerItem>
          <StaggerItem className="flex flex-wrap items-center gap-3">
            {filters.map((f) => {
              const isActive = active === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(f.id)}
                  aria-pressed={isActive}
                  className={`inline-flex h-10 items-center rounded-full border px-4 text-[14px] font-medium transition-colors duration-300 ${
                    isActive
                      ? "border-brandblue-500 bg-brandblue-500 text-white"
                      : "border-[#cfd8dc] bg-[#f6f9fb] text-slate-600 hover:border-brandblue-300"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </StaggerItem>
        </Stagger>

        <Stagger
          key={active}
          as="div"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
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
