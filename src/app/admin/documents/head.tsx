export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Documents | YEHA</title>
      <meta name="description" content="Upload and manage curriculum documents." />
      <meta name="robots" content={robots} />
    </>
  );
}
