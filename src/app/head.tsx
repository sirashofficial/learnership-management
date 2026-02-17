export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Dashboard | YEHA</title>
      <meta name="description" content="Overview of learnership performance, attendance, and tasks." />
      <meta name="robots" content={robots} />
    </>
  );
}
