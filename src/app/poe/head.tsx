export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>POE | YEHA</title>
      <meta name="description" content="Manage portfolio of evidence items." />
      <meta name="robots" content={robots} />
    </>
  );
}
