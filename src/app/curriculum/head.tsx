export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Curriculum | YEHA</title>
      <meta name="description" content="Manage curriculum content and documents." />
      <meta name="robots" content={robots} />
    </>
  );
}
