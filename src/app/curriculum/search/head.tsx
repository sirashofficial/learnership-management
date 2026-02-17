export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Curriculum Search | YEHA</title>
      <meta name="description" content="Search your indexed curriculum documents." />
      <meta name="robots" content={robots} />
    </>
  );
}
