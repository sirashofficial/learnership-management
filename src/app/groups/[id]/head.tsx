export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Group Details | YEHA</title>
      <meta name="description" content="View group details, attendance, and progress." />
      <meta name="robots" content={robots} />
    </>
  );
}
