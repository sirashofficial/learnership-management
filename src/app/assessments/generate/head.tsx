export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Assessment Generator | YEHA</title>
      <meta name="description" content="Generate assessments using AI and curriculum documents." />
      <meta name="robots" content={robots} />
    </>
  );
}
