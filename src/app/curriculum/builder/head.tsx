export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Curriculum Builder | YEHA</title>
      <meta name="description" content="Build assessments from curriculum content." />
      <meta name="robots" content={robots} />
    </>
  );
}
