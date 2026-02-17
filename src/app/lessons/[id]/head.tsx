export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Lesson Details | YEHA</title>
      <meta name="description" content="View lesson plan details and updates." />
      <meta name="robots" content={robots} />
    </>
  );
}
