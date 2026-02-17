export default function Head() {
  const robots = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ? 'index, follow' : 'noindex, nofollow';

  return (
    <>
      <title>Groups | YEHA</title>
      <meta name="description" content="Manage groups, companies, and cohort details." />
      <meta name="robots" content={robots} />
    </>
  );
}
