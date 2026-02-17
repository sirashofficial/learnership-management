export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Moderation | YEHA</title>
      <meta name="description" content="Review and moderate assessment results." />
      <meta name="robots" content={robots} />
    </>
  );
}
