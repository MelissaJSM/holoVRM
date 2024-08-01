import Head from "next/head";
export const Meta = () => {
  const title = "HoloVRM";
  const description =
    "AI로 창조된 홀로라이브멤버와 즐거운 대화를 할 수 있습니다.";
  const imageUrl = "/profile.png";
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
};
