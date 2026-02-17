export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Student Profile | YEHA</title>
      <meta name="description" content="View learner details, attendance, and progress." />
      <meta name="robots" content={robots} />
    </>
  );
}
