export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Lessons | YEHA</title>
      <meta name="description" content="Plan lessons and generate AI-assisted lesson plans." />
      <meta name="robots" content={robots} />
    </>
  );
}
