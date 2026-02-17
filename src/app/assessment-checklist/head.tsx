export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Assessment Checklist | YEHA</title>
      <meta name="description" content="Track assessment completion by group." />
      <meta name="robots" content={robots} />
    </>
  );
}
