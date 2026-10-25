"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import PostCard from "./card";
import type { BlogPost } from "@/lib/blog";
import { loadMoreArticles } from "@/lib/insights-actions";

export type UpdatesPageInfo = { hasNextPage: boolean; endCursor: string | null };

/**
 * "All updates" — headline + filter chips (All, Articles, Events, News) that
 * filter the grid client-side by post category.
 *
 * `cms` posts are the CMS `article` Insights: every one is an article, so the
 * type chips have nothing to separate and are not shown; more pages load
 * through a server action ("Load more"), never from the browser to the CMS.
 */
export default function Updates({
  posts: initialPosts,
  source = "static",
  pageInfo,
}: {
  posts: BlogPost[];
  source?: "static" | "cms";
  pageInfo?: UpdatesPageInfo;
}) {
  const t = useTranslations("Blog.page");
  const locale = useLocale();
  const filters = t.raw("filters") as { id: string; label: string }[];

  const [active, setActive] = useState("all");
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState<UpdatesPageInfo>(pageInfo ?? { hasNextPage: false, endCursor: null });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const visible =
    active === "all"
      ? posts
      : posts.filter(
          (p) => filters.find((f) => f.id === active)?.label === p.category,
        );

  async function loadMore() {
    if (loading || !page.endCursor) return;
    setLoading(true);
    setFailed(false);
    try {
      const result = await loadMoreArticles(locale, page.endCursor);
      if (!result.ok) {
        setFailed(true);
        return;
      }
      setPosts((current) => {
        const seen = new Set(current.map((p) => p.id));
        return [...current, ...result.posts.filter((p) => !seen.has(p.id))];
      });
      setPage({ hasNextPage: result.hasNextPage, endCursor: result.endCursor });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

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
          {source === "static" ? (
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
          ) : null}
        </Stagger>

        <Stagger
          key={active}
          as="div"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          stagger={0.09}
          amount={0.15}
        >
          {visible.map((post) => (
            <StaggerItem as="div" key={post.id ?? post.slug}>
              <PostCard post={post} />
            </StaggerItem>
          ))}
        </Stagger>

        {source === "cms" && (page.hasNextPage || failed) ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            {failed ? (
              <p role="alert" className="text-[14px] leading-5 text-slate-600">
                {t("loadMoreError")}
              </p>
            ) : null}
            {page.hasNextPage ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                aria-busy={loading}
                className="inline-flex h-11 items-center rounded-lg bg-brandblue-50 px-5 text-[16px] leading-6 font-medium text-brandblue-600 transition-colors hover:bg-brandblue-100 focus-visible:outline-2 focus-visible:outline-brandblue-500 disabled:cursor-wait disabled:opacity-60"
              >
                {t("loadMore")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
