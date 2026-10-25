import Image from "next/image";
import { useTranslations } from "next-intl";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { type BlogPost } from "@/lib/blog";
import PostCard from "./card";

const cmsBodyClass = [
  "flex flex-col gap-7 text-[16px] leading-7 text-slate-600 lg:text-[18px]",
  "[&_a]:text-brandblue-600 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-brandblue-500",
  "[&_h2]:text-[24px] [&_h2]:leading-8 [&_h2]:font-semibold [&_h2]:text-slate-900",
  "[&_h3]:text-[20px] [&_h3]:leading-7 [&_h3]:font-semibold [&_h3]:text-slate-900",
  "[&_h4]:text-[18px] [&_h4]:leading-7 [&_h4]:font-semibold [&_h4]:text-slate-900",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-6 [&_ol]:ps-6 [&_li]:mt-2",
  "[&_blockquote]:border-s-4 [&_blockquote]:border-brandblue-500 [&_blockquote]:ps-5 [&_blockquote]:text-slate-900",
].join(" ");

/** First paragraph of sanitized CMS HTML (the lead) and the rest; no lead when it does not open with one. */
function splitLead(html: string | undefined): { lead: string; rest: string } {
  if (!html) return { lead: "", rest: "" };
  const end = html.startsWith("<p>") ? html.indexOf("</p>") : -1;
  return end === -1 ? { lead: "", rest: html } : { lead: html.slice(0, end + 4), rest: html.slice(end + 4) };
}

/**
 * Article layout — white story card (lead paragraph, supporting image, body
 * paragraphs) followed by the related-articles row. Works for both static
 * locale posts and CMS posts: both arrive as the same `BlogPost` shape.
 */
export default function Article({
  post,
  morePosts,
  bodyHtml,
}: {
  post: BlogPost;
  morePosts: BlogPost[];
  /** Sanitized CMS body (lib/cms-html). Its first paragraph is the lead; replaces `post.body` text. */
  bodyHtml?: string;
}) {
  const t = useTranslations("Blog.page");
  const [lead, ...rest] = post.body;
  const html = splitLead(bodyHtml);

  return (
    <section className="bg-slate-25 pb-20 lg:pb-28">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal amount={0.05}>
          <div className="mx-auto max-w-[1062px] rounded-[20px] bg-white px-6 py-10 lg:px-[53px] lg:py-12">
            <div className="mx-auto flex max-w-[956px] flex-col gap-7">
              {html.lead && (
                <div
                  className="[&_a]:underline [&_p]:text-[22px] [&_p]:leading-8 [&_p]:font-medium [&_p]:text-slate-900 lg:[&_p]:text-[28px]"
                  dangerouslySetInnerHTML={{ __html: html.lead }}
                />
              )}
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

              {html.rest && (
                <div
                  data-cms-body=""
                  className={cmsBodyClass}
                  dangerouslySetInnerHTML={{ __html: html.rest }}
                />
              )}

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
