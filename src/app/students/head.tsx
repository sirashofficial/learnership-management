export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Students | YEHA</title>
      <meta name="description" content="Manage learner profiles, progress, and attendance." />
      <meta name="robots" content={robots} />
    </>
  );
}
