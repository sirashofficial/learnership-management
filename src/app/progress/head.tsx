export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Progress | YEHA</title>
      <meta name="description" content="Track learner progress and completion." />
      <meta name="robots" content={robots} />
    </>
  );
}
