export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Compliance | YEHA</title>
      <meta name="description" content="Monitor compliance and attendance requirements." />
      <meta name="robots" content={robots} />
    </>
  );
}
