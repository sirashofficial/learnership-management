export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Admin | YEHA</title>
      <meta name="description" content="Administration dashboard and tools." />
      <meta name="robots" content={robots} />
    </>
  );
}
