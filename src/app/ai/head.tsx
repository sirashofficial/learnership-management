export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>AI Assistant | YEHA</title>
      <meta name="description" content="Get AI help for lessons, assessments, and planning." />
      <meta name="robots" content={robots} />
    </>
  );
}
