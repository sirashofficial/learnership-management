export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Assessments | YEHA</title>
      <meta name="description" content="Create, review, and track learner assessments." />
      <meta name="robots" content={robots} />
    </>
  );
}
