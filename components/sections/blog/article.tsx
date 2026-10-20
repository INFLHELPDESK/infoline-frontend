import Image from "next/image";
import { useTranslations } from "next-intl";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { type BlogPost } from "@/lib/blog";
import PostCard from "./card";

/**
 * Article layout — white story card (lead paragraph, supporting image, body
 * paragraphs) followed by the related-articles row. Works for both static
 * locale posts and CMS posts: both arrive as the same `BlogPost` shape.
 */
export default function Article({
  post,
  morePosts,
}: {
  post: BlogPost;
  morePosts: BlogPost[];
}) {
  const t = useTranslations("Blog.page");
  const [lead, ...rest] = post.body;

  return (
    <section className="bg-slate-25 pb-20 lg:pb-28">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal amount={0.05}>
          <div className="mx-auto max-w-[1062px] rounded-[20px] bg-white px-6 py-10 lg:px-[53px] lg:py-12">
            <div className="mx-auto flex max-w-[956px] flex-col gap-7">
              {lead && (
                <p className="text-[22px] leading-8 font-medium text-slate-900 lg:text-[28px]">
                  {lead}
                </p>
              )}

              <div className="relative aspect-[956/470] w-full overflow-hidden rounded-[28px] bg-slate-100">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1062px) 956px, 100vw"
                  className="object-cover"
                />
              </div>

              <Stagger as="div" className="flex flex-col gap-7" stagger={0.05} amount={0.05}>
                {rest.map((paragraph, i) => (
                  <StaggerItem
                    as="p"
                    key={i}
                    className="text-[16px] leading-7 text-slate-600 lg:text-[18px]"
                  >
                    {paragraph}
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </Reveal>

        {/* Related articles */}
        {morePosts.length > 0 && (
          <div className="mt-16 lg:mt-[78px]">
            <h2 className="mb-6 text-[28px] leading-9 font-semibold text-slate-900 lg:text-[32px] lg:leading-10">
              {t("single.moreLabel")}
            </h2>
            <Stagger
              as="div"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              stagger={0.12}
            >
              {morePosts.map((p) => (
                <StaggerItem as="div" key={p.slug}>
                  <PostCard post={p} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}
      </div>
    </section>
  );
}
